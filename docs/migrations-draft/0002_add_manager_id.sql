-- =============================================================================
-- 0002 — Add manager_id to company_memberships (Organograma 2.0 foundation)
-- =============================================================================
-- ADR-001: manager_id lives in company_memberships (not users) for multi-tenant
-- Risk: 🟡 Medium — adds optional column; existing UI keeps fallback to dept leader
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Add manager_id column (nullable — backward compatible)
-- -----------------------------------------------------------------------------
ALTER TABLE public.company_memberships
  ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_memberships_manager
  ON public.company_memberships(manager_id)
  WHERE manager_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_memberships_company_manager
  ON public.company_memberships(company_id, manager_id);

COMMENT ON COLUMN public.company_memberships.manager_id IS
  'Direct manager of this membership; NULL = top of hierarchy or unset (fallback to dept leader in UI)';

-- -----------------------------------------------------------------------------
-- 2. Self-reference safety constraint: cannot be your own manager
-- -----------------------------------------------------------------------------
ALTER TABLE public.company_memberships
  DROP CONSTRAINT IF EXISTS company_memberships_no_self_manager;

ALTER TABLE public.company_memberships
  ADD CONSTRAINT company_memberships_no_self_manager
  CHECK (manager_id IS NULL OR manager_id <> user_id);

-- -----------------------------------------------------------------------------
-- 3. Trigger to prevent direct cycles (A→B→A) on UPDATE
--    Deeper cycles are caught by the get_org_subtree function below
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_manager_cycle()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.manager_id IS NOT NULL THEN
    -- Direct cycle check: my manager can't be someone I manage
    IF EXISTS (
      SELECT 1 FROM public.company_memberships
      WHERE company_id = NEW.company_id
        AND user_id = NEW.manager_id
        AND manager_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Manager cycle detected: % cannot manage their own manager', NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_manager_cycle ON public.company_memberships;
CREATE TRIGGER trg_prevent_manager_cycle
  BEFORE INSERT OR UPDATE OF manager_id ON public.company_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_manager_cycle();

-- -----------------------------------------------------------------------------
-- 4. Helper function: get_org_subtree — recursive descendants of a user
--    Used by hierarchy queries (org chart, "my team" filters)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_org_subtree(
  root_user_id uuid,
  comp_id uuid
)
RETURNS TABLE(user_id uuid, depth int, path uuid[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE subtree AS (
    SELECT
      cm.user_id,
      0 AS depth,
      ARRAY[cm.user_id] AS path
    FROM public.company_memberships cm
    WHERE cm.user_id = root_user_id
      AND cm.company_id = comp_id
      AND cm.status = 'active'

    UNION ALL

    SELECT
      cm.user_id,
      s.depth + 1,
      s.path || cm.user_id
    FROM public.company_memberships cm
    INNER JOIN subtree s ON cm.manager_id = s.user_id
    WHERE cm.company_id = comp_id
      AND cm.status = 'active'
      AND cm.user_id <> ALL(s.path)  -- cycle protection
      AND s.depth < 20                -- max depth safety
  )
  SELECT user_id, depth, path FROM subtree;
$$;

COMMENT ON FUNCTION public.get_org_subtree IS
  'Returns all subordinates (recursive) of root_user_id in company comp_id, with depth and path';

-- -----------------------------------------------------------------------------
-- 5. Helper function: get_org_ancestors — path up to top
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_org_ancestors(
  leaf_user_id uuid,
  comp_id uuid
)
RETURNS TABLE(user_id uuid, depth int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE ancestors AS (
    SELECT
      cm.manager_id AS user_id,
      1 AS depth,
      ARRAY[cm.user_id, cm.manager_id] AS path
    FROM public.company_memberships cm
    WHERE cm.user_id = leaf_user_id
      AND cm.company_id = comp_id
      AND cm.manager_id IS NOT NULL

    UNION ALL

    SELECT
      cm.manager_id,
      a.depth + 1,
      a.path || cm.manager_id
    FROM public.company_memberships cm
    INNER JOIN ancestors a ON cm.user_id = a.user_id
    WHERE cm.company_id = comp_id
      AND cm.manager_id IS NOT NULL
      AND cm.manager_id <> ALL(a.path)
      AND a.depth < 20
  )
  SELECT user_id, depth FROM ancestors WHERE user_id IS NOT NULL;
$$;

-- =============================================================================
-- END 0002
-- =============================================================================
