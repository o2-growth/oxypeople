-- =============================================================
-- PHASE 1: STRUCTURAL TRIGGERS + VALIDATION RULES
-- =============================================================

-- 1) Trigger: auto-update objective progress when KR changes
CREATE TRIGGER trg_update_objective_progress
  AFTER INSERT OR UPDATE OR DELETE ON public.key_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_objective_progress();

-- 2) Trigger: cascade objective progress when child progress changes
CREATE TRIGGER trg_cascade_objective_progress
  AFTER UPDATE ON public.objectives
  FOR EACH ROW
  EXECUTE FUNCTION public.cascade_on_objective_update();

-- 3) Trigger: process check-in (update KR value + auto-status)
CREATE TRIGGER trg_process_okr_checkin
  AFTER INSERT ON public.okr_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.process_okr_checkin();

-- 4) Trigger: audit objective changes
CREATE TRIGGER trg_audit_objectives
  AFTER INSERT OR UPDATE OR DELETE ON public.objectives
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_objective_changes();

-- 5) Trigger: audit key result changes
CREATE TRIGGER trg_audit_key_results
  AFTER INSERT OR UPDATE OR DELETE ON public.key_results
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_key_result_changes();

-- =============================================================
-- PHASE 1.3: VALIDATION RULES
-- =============================================================

-- 6) Block KR creation on non-operational objectives
CREATE OR REPLACE FUNCTION public.validate_kr_on_operational_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_obj_type text;
BEGIN
  SELECT type INTO v_obj_type
  FROM public.objectives WHERE id = NEW.objective_id;

  IF v_obj_type IS NULL THEN
    RAISE EXCEPTION 'Objective not found';
  END IF;

  IF v_obj_type != 'operational' THEN
    RAISE EXCEPTION 'Key Results can only be added to operational objectives. This objective is of type: %', v_obj_type;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_kr_operational
  BEFORE INSERT ON public.key_results
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_kr_on_operational_only();

-- 7) Validate KR weights sum to 100% (on weight update only)
CREATE OR REPLACE FUNCTION public.validate_kr_weights()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total numeric;
  v_count integer;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.weight_percentage IS DISTINCT FROM NEW.weight_percentage THEN
    SELECT SUM(CASE WHEN id = NEW.id THEN NEW.weight_percentage ELSE weight_percentage END), COUNT(*)
    INTO v_total, v_count
    FROM public.key_results
    WHERE objective_id = NEW.objective_id;

    IF v_count > 1 AND v_total > 0 AND v_total != 100 THEN
      RAISE EXCEPTION 'KR weights must sum to 100 percent. Current total: %', v_total;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_kr_weights
  BEFORE UPDATE ON public.key_results
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_kr_weights();

-- 8) Validate child objective weights sum to 100% (on relation weight update)
CREATE OR REPLACE FUNCTION public.validate_child_weights()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total numeric;
  v_count integer;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.weight_percentage IS DISTINCT FROM NEW.weight_percentage THEN
    SELECT SUM(CASE WHEN id = NEW.id THEN NEW.weight_percentage ELSE weight_percentage END), COUNT(*)
    INTO v_total, v_count
    FROM public.objective_relations
    WHERE parent_objective_id = NEW.parent_objective_id;

    IF v_count > 1 AND v_total > 0 AND v_total != 100 THEN
      RAISE EXCEPTION 'Child objective weights must sum to 100 percent. Current total: %', v_total;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_child_weights
  BEFORE UPDATE ON public.objective_relations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_child_weights();

-- 9) Validate check-in: minimum comment length + operational only
CREATE OR REPLACE FUNCTION public.validate_checkin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_min_chars integer;
  v_obj_type text;
BEGIN
  SELECT checkin_min_chars INTO v_min_chars
  FROM public.okr_settings WHERE company_id = NEW.company_id;

  v_min_chars := COALESCE(v_min_chars, 10);

  IF length(trim(NEW.comment)) < v_min_chars THEN
    RAISE EXCEPTION 'Check-in comment must have at least % characters', v_min_chars;
  END IF;

  SELECT o.type INTO v_obj_type
  FROM public.key_results kr
  JOIN public.objectives o ON o.id = kr.objective_id
  WHERE kr.id = NEW.key_result_id;

  IF v_obj_type != 'operational' THEN
    RAISE EXCEPTION 'Check-ins can only be done on operational objectives';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_checkin
  BEFORE INSERT ON public.okr_checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_checkin();

-- 10) Validate objective hierarchy rules
CREATE OR REPLACE FUNCTION public.validate_objective_hierarchy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_parent_type text;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT type INTO v_parent_type
    FROM public.objectives WHERE id = NEW.parent_id;

    IF v_parent_type = 'operational' THEN
      RAISE EXCEPTION 'Cannot create child objectives under operational objectives';
    END IF;

    IF v_parent_type = 'strategic' AND NEW.type NOT IN ('tactical', 'operational') THEN
      RAISE EXCEPTION 'Strategic objectives can only have tactical or operational children';
    END IF;

    IF v_parent_type = 'tactical' AND NEW.type != 'operational' THEN
      RAISE EXCEPTION 'Tactical objectives can only have operational children';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_objective_hierarchy
  BEFORE INSERT OR UPDATE ON public.objectives
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_objective_hierarchy();