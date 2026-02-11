
-- Add soft delete columns
ALTER TABLE public.objectives ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.key_results ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Index for filtering active records efficiently
CREATE INDEX IF NOT EXISTS idx_objectives_deleted_at ON public.objectives (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_key_results_deleted_at ON public.key_results (deleted_at) WHERE deleted_at IS NULL;

-- Update the progress recalculation to exclude soft-deleted KRs
CREATE OR REPLACE FUNCTION public.update_objective_progress()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_objective_id uuid;
  v_new_progress integer;
  v_parent_id uuid;
  v_total_weight numeric;
BEGIN
  v_objective_id := COALESCE(NEW.objective_id, OLD.objective_id);
  SELECT INTO v_total_weight COALESCE(SUM(weight_percentage), 0)
  FROM public.key_results WHERE objective_id = v_objective_id AND deleted_at IS NULL;

  IF v_total_weight > 0 THEN
    SELECT INTO v_new_progress COALESCE(
      (SUM(
        LEAST(100, 
          CASE 
            WHEN kr_type = 'binary' THEN CASE WHEN current_value >= target_value THEN 100 ELSE 0 END
            WHEN direction = 'down' THEN
              CASE
                WHEN NULLIF(initial_value - target_value, 0) IS NULL THEN 0
                ELSE ((initial_value - current_value)::numeric / (initial_value - target_value)::numeric) * 100
              END
            WHEN NULLIF(target_value - initial_value, 0) IS NULL THEN 0
            ELSE ((current_value - initial_value)::numeric / (target_value - initial_value)::numeric) * 100
          END
        ) * weight_percentage
      ) / NULLIF(SUM(weight_percentage), 0))::integer, 0
    ) FROM public.key_results WHERE objective_id = v_objective_id AND deleted_at IS NULL;
  ELSE
    v_new_progress := 0;
  END IF;

  UPDATE public.objectives SET progress = v_new_progress, updated_at = now() WHERE id = v_objective_id;

  SELECT parent_id INTO v_parent_id FROM public.objectives WHERE id = v_objective_id;
  IF v_parent_id IS NOT NULL THEN
    PERFORM public.cascade_objective_progress(v_parent_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- Update cascade to exclude soft-deleted objectives
CREATE OR REPLACE FUNCTION public.cascade_objective_progress(p_objective_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_new_progress integer;
  v_parent_id uuid;
  v_has_relations boolean;
  v_has_children boolean;
  v_total_weight numeric;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.objective_relations WHERE parent_objective_id = p_objective_id) INTO v_has_relations;

  IF v_has_relations THEN
    SELECT INTO v_total_weight COALESCE(SUM(weight_percentage), 0)
    FROM public.objective_relations r
    JOIN public.objectives o ON o.id = r.child_objective_id
    WHERE r.parent_objective_id = p_objective_id AND o.deleted_at IS NULL;

    IF v_total_weight > 0 THEN
      SELECT INTO v_new_progress COALESCE(
        (SUM(o.progress * r.weight_percentage) / NULLIF(SUM(r.weight_percentage), 0))::integer, 0
      ) FROM public.objective_relations r
      JOIN public.objectives o ON o.id = r.child_objective_id
      WHERE r.parent_objective_id = p_objective_id AND o.deleted_at IS NULL;
    ELSE
      SELECT INTO v_new_progress COALESCE(AVG(o.progress)::integer, 0)
      FROM public.objective_relations r
      JOIN public.objectives o ON o.id = r.child_objective_id
      WHERE r.parent_objective_id = p_objective_id AND o.deleted_at IS NULL;
    END IF;
  ELSE
    SELECT EXISTS(SELECT 1 FROM public.objectives WHERE parent_id = p_objective_id AND deleted_at IS NULL) INTO v_has_children;
    IF v_has_children THEN
      SELECT INTO v_new_progress COALESCE(AVG(progress)::integer, 0)
      FROM public.objectives WHERE parent_id = p_objective_id AND deleted_at IS NULL;
    ELSE
      RETURN;
    END IF;
  END IF;

  UPDATE public.objectives SET progress = v_new_progress, updated_at = now() WHERE id = p_objective_id;

  SELECT parent_id INTO v_parent_id FROM public.objectives WHERE id = p_objective_id;
  IF v_parent_id IS NOT NULL THEN
    PERFORM public.cascade_objective_progress(v_parent_id);
  END IF;
END;
$function$;

-- Update auto_status function to exclude soft-deleted KRs
CREATE OR REPLACE FUNCTION public.update_objective_auto_status(p_objective_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_obj RECORD;
  v_expected numeric;
  v_auto_status text;
  v_settings RECORD;
  v_last_checkin timestamptz;
  v_has_krs boolean;
BEGIN
  SELECT * INTO v_obj FROM public.objectives WHERE id = p_objective_id;
  IF NOT FOUND THEN RETURN; END IF;

  IF v_obj.status IN ('completed', 'canceled') THEN
    UPDATE public.objectives SET auto_status = v_obj.status::text, last_status_check = now()
    WHERE id = p_objective_id;
    RETURN;
  END IF;

  SELECT * INTO v_settings FROM public.okr_settings WHERE company_id = v_obj.company_id;
  v_expected := public.calculate_expected_progress(v_obj.period_id, v_obj.due_date);

  SELECT MAX(last_checkin_at) INTO v_last_checkin
  FROM public.key_results WHERE objective_id = p_objective_id AND deleted_at IS NULL;

  IF v_obj.type = 'operational' THEN
    SELECT EXISTS(SELECT 1 FROM public.key_results WHERE objective_id = p_objective_id AND deleted_at IS NULL) INTO v_has_krs;
    IF NOT v_has_krs THEN
      v_auto_status := 'risk';
    ELSE
      v_auto_status := public.determine_objective_auto_status(
        v_obj.progress, v_expected, v_last_checkin,
        COALESCE(v_settings.checkin_overdue_days, 7),
        COALESCE(v_settings.deviation_attention_pct, 10),
        COALESCE(v_settings.deviation_risk_pct, 25)
      );
    END IF;
  ELSE
    v_auto_status := public.determine_objective_auto_status(
      v_obj.progress, v_expected, v_last_checkin,
      COALESCE(v_settings.checkin_overdue_days, 7),
      COALESCE(v_settings.deviation_attention_pct, 10),
      COALESCE(v_settings.deviation_risk_pct, 25)
    );
  END IF;

  UPDATE public.objectives
  SET auto_status = v_auto_status, expected_progress = v_expected, last_status_check = now()
  WHERE id = p_objective_id;
END;
$function$;
