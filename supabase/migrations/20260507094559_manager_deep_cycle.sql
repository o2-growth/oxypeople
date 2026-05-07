-- =============================================================================
-- Manager hierarchy: prevent DEEP cycles (A -> B -> C -> A)
-- =============================================================================
-- Replaces the shallow check from migration 20260501003200_add_manager_id.sql
-- which only blocked direct A<->B cycles. This walks the full management
-- chain UP from NEW.manager_id (max 50 hops) and raises if it ever reaches
-- NEW.user_id, catching cycles of arbitrary depth.
--
-- Trigger binding (trg_prevent_manager_cycle) is left intact; we only
-- replace the underlying function body.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.prevent_manager_cycle()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  current_id uuid;
  depth int := 0;
BEGIN
  -- Top of the hierarchy: nothing to check
  IF NEW.manager_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Self-management is already blocked by the CHECK constraint
  -- company_memberships_no_self_manager, but be defensive:
  IF NEW.manager_id = NEW.user_id THEN
    RAISE EXCEPTION 'Manager cycle detected: % cannot manage themselves', NEW.user_id;
  END IF;

  current_id := NEW.manager_id;

  WHILE current_id IS NOT NULL AND depth < 50 LOOP
    IF current_id = NEW.user_id THEN
      RAISE EXCEPTION
        'Manager cycle detected: % cannot report up through %',
        NEW.user_id, NEW.manager_id;
    END IF;

    SELECT manager_id
      INTO current_id
      FROM public.company_memberships
     WHERE user_id = current_id
       AND company_id = NEW.company_id
     LIMIT 1;

    depth := depth + 1;
  END LOOP;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_manager_cycle() IS
  'Walks up the management chain (max 50 hops) and raises on any cycle. '
  'Replaces the shallow direct-cycle check from 20260501003200_add_manager_id.sql.';

-- =============================================================================
-- END manager_deep_cycle
-- =============================================================================
