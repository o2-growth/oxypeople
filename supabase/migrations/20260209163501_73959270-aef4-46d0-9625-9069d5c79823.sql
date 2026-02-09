
-- Add direction column to key_results (up = higher is better, down = lower is better e.g. SLA)
ALTER TABLE public.key_results
ADD COLUMN direction text NOT NULL DEFAULT 'up'
CHECK (direction IN ('up', 'down'));

-- Update the progress calculation trigger to handle direction
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
  FROM public.key_results WHERE objective_id = v_objective_id;

  IF v_total_weight > 0 THEN
    SELECT INTO v_new_progress COALESCE(
      (SUM(
        LEAST(100, 
          CASE 
            WHEN kr_type = 'binary' THEN CASE WHEN current_value >= target_value THEN 100 ELSE 0 END
            WHEN direction = 'down' THEN
              -- For "down" direction: lower is better (e.g. SLA time)
              CASE
                WHEN NULLIF(initial_value - target_value, 0) IS NULL THEN 0
                ELSE ((initial_value - current_value)::numeric / (initial_value - target_value)::numeric) * 100
              END
            WHEN NULLIF(target_value - initial_value, 0) IS NULL THEN 0
            ELSE ((current_value - initial_value)::numeric / (target_value - initial_value)::numeric) * 100
          END
        ) * weight_percentage
      ) / NULLIF(SUM(weight_percentage), 0))::integer, 0
    ) FROM public.key_results WHERE objective_id = v_objective_id;
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
