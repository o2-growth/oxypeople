-- =============================================================================
-- OKR Access Levels — three-tier permission model decoupled from job titles.
-- =============================================================================
-- Tiers:
--   manager     — C-Level, Heads. Can create/edit objectives. Sees by visibility.
--   contributor — Senior/Pleno ICs. Cannot create objectives, but can manage
--                 KRs and check-ins on objectives where they are owner/contributor.
--                 Sees by visibility.
--   restricted  — Junior/Estagiário. Read-only, and only on objectives where
--                 they are explicitly marked (owner / assignee / collaborator).
--
-- Risk: 🟡 Medium — rewrites SELECT/INSERT/UPDATE/DELETE policies on the OKR
-- domain. Additive on schema; replaces existing policies one-by-one with
-- DROP + CREATE for safe re-application.
-- =============================================================================

-- 1) New column on company_memberships ----------------------------------------
ALTER TABLE public.company_memberships
  ADD COLUMN IF NOT EXISTS okr_access_level text NOT NULL DEFAULT 'contributor'
    CHECK (okr_access_level IN ('manager', 'contributor', 'restricted'));

CREATE INDEX IF NOT EXISTS idx_company_memberships_okr_access
  ON public.company_memberships(company_id, okr_access_level);

-- 2) Helper functions ----------------------------------------------------------
-- has_okr_access(user, company, min_level) returns true if the user's tier
-- in this company is >= the requested minimum.
CREATE OR REPLACE FUNCTION public.has_okr_access(
  p_user_id uuid,
  p_company_id uuid,
  p_min_level text
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships cm
    WHERE cm.user_id = p_user_id
      AND cm.company_id = p_company_id
      AND cm.status = 'active'
      AND CASE p_min_level
            WHEN 'restricted'  THEN true
            WHEN 'contributor' THEN cm.okr_access_level IN ('manager', 'contributor')
            WHEN 'manager'     THEN cm.okr_access_level = 'manager'
            ELSE false
          END
  );
$$;

-- is_okr_collaborator: user is owner / assignee / created_by / contributor /
-- editor of the given objective (i.e. "explicitly marked").
CREATE OR REPLACE FUNCTION public.is_okr_collaborator(
  p_user_id uuid,
  p_objective_id uuid
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = p_objective_id
      AND (
        o.owner_id    = p_user_id
        OR o.assignee_id = p_user_id
        OR o.created_by  = p_user_id
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.objective_collaborators oc
    WHERE oc.objective_id = p_objective_id
      AND oc.user_id = p_user_id
  );
$$;

-- =============================================================================
-- 3) OBJECTIVES policies
-- =============================================================================
DROP POLICY IF EXISTS "Members can view company objectives" ON public.objectives;
DROP POLICY IF EXISTS "Members can create objectives"      ON public.objectives;
DROP POLICY IF EXISTS "Owners can update objectives"       ON public.objectives;
DROP POLICY IF EXISTS "Owners can delete objectives"       ON public.objectives;
DROP POLICY IF EXISTS "View objectives with permissions"   ON public.objectives;
DROP POLICY IF EXISTS "Create objectives with permissions" ON public.objectives;
DROP POLICY IF EXISTS "Update objectives with permissions" ON public.objectives;
DROP POLICY IF EXISTS "Delete objectives with permissions" ON public.objectives;

-- SELECT: contributors+ see by visibility; restricted only where explicitly marked.
CREATE POLICY "okr_objectives_select"
ON public.objectives FOR SELECT
USING (
  is_company_member(auth.uid(), company_id)
  AND (
    -- always visible to people directly tied to the objective
    is_okr_collaborator(auth.uid(), id)
    OR
    -- contributors and managers see by visibility
    (
      has_okr_access(auth.uid(), company_id, 'contributor')
      AND (
        visibility = 'company'::post_visibility
        OR (
          visibility = 'public'::post_visibility
        )
        OR (
          team_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = objectives.team_id AND tm.user_id = auth.uid()
          )
        )
      )
    )
    OR is_company_admin(auth.uid(), company_id)
  )
);

-- INSERT: only managers (C-Level/Heads) or admins.
CREATE POLICY "okr_objectives_insert"
ON public.objectives FOR INSERT
WITH CHECK (
  is_company_member(auth.uid(), company_id)
  AND created_by = auth.uid()
  AND (
    has_okr_access(auth.uid(), company_id, 'manager')
    OR is_company_admin(auth.uid(), company_id)
  )
);

-- UPDATE: managers+, owners, assignees, editor collaborators, admins.
CREATE POLICY "okr_objectives_update"
ON public.objectives FOR UPDATE
USING (
  is_company_member(auth.uid(), company_id)
  AND (
    owner_id    = auth.uid()
    OR assignee_id = auth.uid()
    OR is_company_admin(auth.uid(), company_id)
    OR has_okr_access(auth.uid(), company_id, 'manager')
    OR EXISTS (
      SELECT 1 FROM public.objective_collaborators oc
      WHERE oc.objective_id = objectives.id
        AND oc.user_id = auth.uid()
        AND oc.role IN ('editor', 'contributor')
    )
  )
);

-- DELETE: only owner / created_by / admin.
CREATE POLICY "okr_objectives_delete"
ON public.objectives FOR DELETE
USING (
  is_company_member(auth.uid(), company_id)
  AND (
    owner_id   = auth.uid()
    OR created_by = auth.uid()
    OR is_company_admin(auth.uid(), company_id)
  )
);

-- =============================================================================
-- 4) KEY_RESULTS policies — owners + contributors of the parent objective.
-- =============================================================================
DROP POLICY IF EXISTS "Users can view key results of visible objectives" ON public.key_results;
DROP POLICY IF EXISTS "Authorized users can insert key results"          ON public.key_results;
DROP POLICY IF EXISTS "Authorized users can update key results"          ON public.key_results;
DROP POLICY IF EXISTS "Authorized users can delete key results"          ON public.key_results;
DROP POLICY IF EXISTS "Objective owners can manage key results"          ON public.key_results;

-- SELECT: piggyback on the parent objective's SELECT policy.
CREATE POLICY "okr_key_results_select"
ON public.key_results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = key_results.objective_id
    -- The objectives SELECT policy will be evaluated when reading o.
  )
);

-- INSERT/UPDATE: owner/assignee/created_by of the objective, OR a marked
-- collaborator (any role), OR an admin.
CREATE POLICY "okr_key_results_insert"
ON public.key_results FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = key_results.objective_id
      AND (
        is_okr_collaborator(auth.uid(), o.id)
        OR is_company_admin(auth.uid(), o.company_id)
      )
  )
);

CREATE POLICY "okr_key_results_update"
ON public.key_results FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = key_results.objective_id
      AND (
        is_okr_collaborator(auth.uid(), o.id)
        OR (key_results.owner_user_id = auth.uid())
        OR is_company_admin(auth.uid(), o.company_id)
      )
  )
);

CREATE POLICY "okr_key_results_delete"
ON public.key_results FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = key_results.objective_id
      AND (
        o.owner_id = auth.uid()
        OR o.created_by = auth.uid()
        OR is_company_admin(auth.uid(), o.company_id)
      )
  )
);

-- =============================================================================
-- 5) OKR_CHECKINS — same actor model as KRs.
-- =============================================================================
DROP POLICY IF EXISTS "Members can view check-ins"            ON public.okr_checkins;
DROP POLICY IF EXISTS "Authorized can create check-ins"       ON public.okr_checkins;
DROP POLICY IF EXISTS "Authors can update own check-ins"      ON public.okr_checkins;
DROP POLICY IF EXISTS "Authors can delete own check-ins"      ON public.okr_checkins;
DROP POLICY IF EXISTS "Users can create checkins on their KRs" ON public.okr_checkins;
DROP POLICY IF EXISTS "Members can view company checkins"     ON public.okr_checkins;
DROP POLICY IF EXISTS "okr_checkins_select"                   ON public.okr_checkins;
DROP POLICY IF EXISTS "okr_checkins_insert"                   ON public.okr_checkins;
DROP POLICY IF EXISTS "okr_checkins_update"                   ON public.okr_checkins;
DROP POLICY IF EXISTS "okr_checkins_delete"                   ON public.okr_checkins;

CREATE POLICY "okr_checkins_select"
ON public.okr_checkins FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.key_results kr
    JOIN public.objectives o ON o.id = kr.objective_id
    WHERE kr.id = okr_checkins.key_result_id
  )
);

CREATE POLICY "okr_checkins_insert"
ON public.okr_checkins FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.key_results kr
    JOIN public.objectives o ON o.id = kr.objective_id
    WHERE kr.id = okr_checkins.key_result_id
      AND (
        is_okr_collaborator(auth.uid(), o.id)
        OR kr.owner_user_id = auth.uid()
        OR is_company_admin(auth.uid(), o.company_id)
      )
  )
);

CREATE POLICY "okr_checkins_update"
ON public.okr_checkins FOR UPDATE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.key_results kr
    JOIN public.objectives o ON o.id = kr.objective_id
    WHERE kr.id = okr_checkins.key_result_id
      AND is_company_admin(auth.uid(), o.company_id)
  )
);

CREATE POLICY "okr_checkins_delete"
ON public.okr_checkins FOR DELETE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.key_results kr
    JOIN public.objectives o ON o.id = kr.objective_id
    WHERE kr.id = okr_checkins.key_result_id
      AND is_company_admin(auth.uid(), o.company_id)
  )
);

-- =============================================================================
-- 6) OBJECTIVE_RELATIONS — managers+ (cascade strategic→tactical→operational).
-- =============================================================================
DROP POLICY IF EXISTS "Members can view objective relations"    ON public.objective_relations;
DROP POLICY IF EXISTS "Authorized users can manage relations"   ON public.objective_relations;
DROP POLICY IF EXISTS "okr_objective_relations_select"          ON public.objective_relations;
DROP POLICY IF EXISTS "okr_objective_relations_manage"          ON public.objective_relations;

CREATE POLICY "okr_objective_relations_select"
ON public.objective_relations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = objective_relations.parent_objective_id
    -- delegated
  )
);

CREATE POLICY "okr_objective_relations_manage"
ON public.objective_relations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = objective_relations.parent_objective_id
      AND (
        has_okr_access(auth.uid(), o.company_id, 'manager')
        OR is_company_admin(auth.uid(), o.company_id)
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = objective_relations.parent_objective_id
      AND (
        has_okr_access(auth.uid(), o.company_id, 'manager')
        OR is_company_admin(auth.uid(), o.company_id)
      )
  )
);

-- =============================================================================
-- 7) OBJECTIVE_COLLABORATORS — only managers+ or the objective owner can add
--    collaborators. Restricted users cannot add anyone.
-- =============================================================================
DROP POLICY IF EXISTS "Members view collaborators"          ON public.objective_collaborators;
DROP POLICY IF EXISTS "Authorized manage collaborators"     ON public.objective_collaborators;
DROP POLICY IF EXISTS "okr_collaborators_select"            ON public.objective_collaborators;
DROP POLICY IF EXISTS "okr_collaborators_manage"            ON public.objective_collaborators;

CREATE POLICY "okr_collaborators_select"
ON public.objective_collaborators FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = objective_collaborators.objective_id
    -- delegated
  )
);

CREATE POLICY "okr_collaborators_manage"
ON public.objective_collaborators FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = objective_collaborators.objective_id
      AND (
        o.owner_id    = auth.uid()
        OR o.created_by = auth.uid()
        OR has_okr_access(auth.uid(), o.company_id, 'manager')
        OR is_company_admin(auth.uid(), o.company_id)
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = objective_collaborators.objective_id
      AND (
        o.owner_id    = auth.uid()
        OR o.created_by = auth.uid()
        OR has_okr_access(auth.uid(), o.company_id, 'manager')
        OR is_company_admin(auth.uid(), o.company_id)
      )
  )
);
