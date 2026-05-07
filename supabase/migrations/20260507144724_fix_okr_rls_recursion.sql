-- =============================================================================
-- Fix infinite recursion in OKR RLS policies (introduced in 20260505213512).
-- =============================================================================
-- Symptom: any UPDATE on `objectives` aborts with
--   "infinite recursion detected in policy for relation \"objectives\""
-- Root cause: `okr_objectives_update` does EXISTS over `objective_collaborators`,
-- whose `okr_collaborators_select` policy does EXISTS over `objectives`, whose
-- own SELECT policy calls `is_okr_collaborator()` which reads `objectives`. PG
-- detects the dependency loop on every UPDATE statement.
--
-- Fix: collapse all cross-table reads into SECURITY DEFINER helper functions
-- so the policy bodies never re-enter the same RLS-protected tables.
-- Policies become thin wrappers around these helpers.
-- =============================================================================

-- 1) Helper: can the user view a given objective?
--    Used by KR / check-in / relation / collaborator SELECT delegation.
--    NOT used by objectives.SELECT itself — see note below.
CREATE OR REPLACE FUNCTION public.can_view_objective(p_user uuid, p_obj_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.objectives o
    WHERE o.id = p_obj_id
      AND public.is_company_member(p_user, o.company_id)
      AND (
        o.owner_id = p_user
        OR o.assignee_id = p_user
        OR o.created_by = p_user
        OR EXISTS (
          SELECT 1 FROM public.objective_collaborators oc
          WHERE oc.objective_id = o.id AND oc.user_id = p_user
        )
        OR (
          public.has_okr_access(p_user, o.company_id, 'contributor')
          AND (
            o.visibility IN ('company'::post_visibility, 'public'::post_visibility)
            OR (
              o.team_id IS NOT NULL
              AND EXISTS (
                SELECT 1 FROM public.team_members tm
                WHERE tm.team_id = o.team_id AND tm.user_id = p_user
              )
            )
          )
        )
        OR public.is_company_admin(p_user, o.company_id)
      )
  );
$$;

-- 1b) Lightweight helper used inline in `objectives` SELECT policy. Isolated so
--     the policy body doesn't recurse into objective_collaborators' own RLS.
CREATE OR REPLACE FUNCTION public.is_objective_collaborator(p_user uuid, p_obj_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.objective_collaborators oc
    WHERE oc.objective_id = p_obj_id AND oc.user_id = p_user
  );
$$;

-- 2) Helper: can the user edit a given objective?
CREATE OR REPLACE FUNCTION public.can_edit_objective(p_user uuid, p_obj_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.objectives o
    WHERE o.id = p_obj_id
      AND public.is_company_member(p_user, o.company_id)
      AND (
        o.owner_id = p_user
        OR o.assignee_id = p_user
        OR public.is_company_admin(p_user, o.company_id)
        OR public.has_okr_access(p_user, o.company_id, 'manager')
        OR EXISTS (
          SELECT 1 FROM public.objective_collaborators oc
          WHERE oc.objective_id = o.id
            AND oc.user_id = p_user
            AND oc.role IN ('editor', 'contributor')
        )
      )
  );
$$;

-- 3) Helper: can the user delete a given objective?
CREATE OR REPLACE FUNCTION public.can_delete_objective(p_user uuid, p_obj_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = p_obj_id
      AND public.is_company_member(p_user, o.company_id)
      AND (
        o.owner_id = p_user
        OR o.created_by = p_user
        OR public.is_company_admin(p_user, o.company_id)
      )
  );
$$;

-- 4) Helper: can the user manage relations (cascade) under a parent objective?
CREATE OR REPLACE FUNCTION public.can_manage_relations(p_user uuid, p_parent_obj_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = p_parent_obj_id
      AND (
        public.has_okr_access(p_user, o.company_id, 'manager')
        OR public.is_company_admin(p_user, o.company_id)
      )
  );
$$;

-- 5) Helper: can the user manage collaborators of a given objective?
CREATE OR REPLACE FUNCTION public.can_manage_collaborators(p_user uuid, p_obj_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = p_obj_id
      AND (
        o.owner_id = p_user
        OR o.created_by = p_user
        OR public.has_okr_access(p_user, o.company_id, 'manager')
        OR public.is_company_admin(p_user, o.company_id)
      )
  );
$$;

-- 6) Helper for KR insert/update permission.
CREATE OR REPLACE FUNCTION public.can_edit_kr(p_user uuid, p_kr_id uuid, p_objective_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.objectives o
    LEFT JOIN public.key_results kr ON kr.id = p_kr_id
    WHERE o.id = COALESCE(p_objective_id, kr.objective_id)
      AND (
        o.owner_id = p_user
        OR o.assignee_id = p_user
        OR o.created_by = p_user
        OR (kr.owner_user_id IS NOT NULL AND kr.owner_user_id = p_user)
        OR EXISTS (
          SELECT 1 FROM public.objective_collaborators oc
          WHERE oc.objective_id = o.id AND oc.user_id = p_user
        )
        OR public.is_company_admin(p_user, o.company_id)
      )
  );
$$;

-- =============================================================================
-- Replace policies with thin wrappers around the helpers above.
-- =============================================================================

-- OBJECTIVES ----------------------------------------------------------------
DROP POLICY IF EXISTS "okr_objectives_select" ON public.objectives;
DROP POLICY IF EXISTS "okr_objectives_insert" ON public.objectives;
DROP POLICY IF EXISTS "okr_objectives_update" ON public.objectives;
DROP POLICY IF EXISTS "okr_objectives_delete" ON public.objectives;

-- IMPORTANT: kept inline (not via can_view_objective) because INSERT...RETURNING
-- evaluates SELECT against the freshly-inserted row in the same statement, and
-- a SECURITY DEFINER function querying objectives there does not see the new
-- row → would block legitimate inserts. Inline expressions read NEW directly.
CREATE POLICY "okr_objectives_select" ON public.objectives FOR SELECT
USING (
  is_company_member(auth.uid(), company_id)
  AND (
    owner_id    = auth.uid()
    OR assignee_id = auth.uid()
    OR created_by  = auth.uid()
    OR public.is_objective_collaborator(auth.uid(), id)
    OR (
      has_okr_access(auth.uid(), company_id, 'contributor')
      AND (
        visibility IN ('company'::post_visibility, 'public'::post_visibility)
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

CREATE POLICY "okr_objectives_insert" ON public.objectives FOR INSERT
WITH CHECK (
  is_company_member(auth.uid(), company_id)
  AND created_by = auth.uid()
  AND (
    has_okr_access(auth.uid(), company_id, 'manager')
    OR is_company_admin(auth.uid(), company_id)
  )
);

CREATE POLICY "okr_objectives_update" ON public.objectives FOR UPDATE
USING (public.can_edit_objective(auth.uid(), id));

CREATE POLICY "okr_objectives_delete" ON public.objectives FOR DELETE
USING (public.can_delete_objective(auth.uid(), id));

-- KEY_RESULTS ---------------------------------------------------------------
DROP POLICY IF EXISTS "okr_key_results_select" ON public.key_results;
DROP POLICY IF EXISTS "okr_key_results_insert" ON public.key_results;
DROP POLICY IF EXISTS "okr_key_results_update" ON public.key_results;
DROP POLICY IF EXISTS "okr_key_results_delete" ON public.key_results;

CREATE POLICY "okr_key_results_select" ON public.key_results FOR SELECT
USING (public.can_view_objective(auth.uid(), objective_id));

CREATE POLICY "okr_key_results_insert" ON public.key_results FOR INSERT
WITH CHECK (public.can_edit_kr(auth.uid(), id, objective_id));

CREATE POLICY "okr_key_results_update" ON public.key_results FOR UPDATE
USING (public.can_edit_kr(auth.uid(), id, objective_id));

CREATE POLICY "okr_key_results_delete" ON public.key_results FOR DELETE
USING (public.can_delete_objective(auth.uid(), objective_id));

-- OKR_CHECKINS --------------------------------------------------------------
DROP POLICY IF EXISTS "okr_checkins_select" ON public.okr_checkins;
DROP POLICY IF EXISTS "okr_checkins_insert" ON public.okr_checkins;
DROP POLICY IF EXISTS "okr_checkins_update" ON public.okr_checkins;
DROP POLICY IF EXISTS "okr_checkins_delete" ON public.okr_checkins;

CREATE POLICY "okr_checkins_select" ON public.okr_checkins FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.key_results kr
    WHERE kr.id = okr_checkins.key_result_id
      AND public.can_view_objective(auth.uid(), kr.objective_id)
  )
);

CREATE POLICY "okr_checkins_insert" ON public.okr_checkins FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.key_results kr
    WHERE kr.id = okr_checkins.key_result_id
      AND public.can_edit_kr(auth.uid(), kr.id, kr.objective_id)
  )
);

CREATE POLICY "okr_checkins_update" ON public.okr_checkins FOR UPDATE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.key_results kr
    JOIN public.objectives o ON o.id = kr.objective_id
    WHERE kr.id = okr_checkins.key_result_id
      AND public.is_company_admin(auth.uid(), o.company_id)
  )
);

CREATE POLICY "okr_checkins_delete" ON public.okr_checkins FOR DELETE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.key_results kr
    JOIN public.objectives o ON o.id = kr.objective_id
    WHERE kr.id = okr_checkins.key_result_id
      AND public.is_company_admin(auth.uid(), o.company_id)
  )
);

-- OBJECTIVE_RELATIONS -------------------------------------------------------
DROP POLICY IF EXISTS "okr_objective_relations_select" ON public.objective_relations;
DROP POLICY IF EXISTS "okr_objective_relations_manage" ON public.objective_relations;

CREATE POLICY "okr_objective_relations_select" ON public.objective_relations FOR SELECT
USING (public.can_view_objective(auth.uid(), parent_objective_id));

CREATE POLICY "okr_objective_relations_manage" ON public.objective_relations FOR ALL
USING (public.can_manage_relations(auth.uid(), parent_objective_id))
WITH CHECK (public.can_manage_relations(auth.uid(), parent_objective_id));

-- OBJECTIVE_COLLABORATORS ---------------------------------------------------
DROP POLICY IF EXISTS "okr_collaborators_select" ON public.objective_collaborators;
DROP POLICY IF EXISTS "okr_collaborators_manage" ON public.objective_collaborators;

CREATE POLICY "okr_collaborators_select" ON public.objective_collaborators FOR SELECT
USING (
  user_id = auth.uid()
  OR public.can_view_objective(auth.uid(), objective_id)
);

CREATE POLICY "okr_collaborators_manage" ON public.objective_collaborators FOR ALL
USING (public.can_manage_collaborators(auth.uid(), objective_id))
WITH CHECK (public.can_manage_collaborators(auth.uid(), objective_id));

-- =============================================================================
-- Allow audit triggers (SECURITY DEFINER) to INSERT into okr_audit_log without
-- being blocked by missing INSERT policy (table only had a SELECT policy
-- previously — the AFTER trigger on objectives/key_results would fail under
-- some auth contexts and propagate the error back to the caller).
-- =============================================================================
DROP POLICY IF EXISTS "System inserts audit log" ON public.okr_audit_log;
CREATE POLICY "System inserts audit log"
ON public.okr_audit_log FOR INSERT
WITH CHECK (true);
