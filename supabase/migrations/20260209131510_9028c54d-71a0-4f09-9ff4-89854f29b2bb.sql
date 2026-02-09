
-- ==========================================
-- OKR GOVERNANCE: PART 3 — Full Implementation
-- ==========================================

-- 1. OKR Settings (per company, configurable)
CREATE TABLE public.okr_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  checkin_frequency text NOT NULL DEFAULT 'weekly', -- weekly, biweekly, monthly
  checkin_min_chars integer NOT NULL DEFAULT 20,
  deviation_attention_pct numeric NOT NULL DEFAULT 10,  -- -10% = attention
  deviation_risk_pct numeric NOT NULL DEFAULT 25,       -- -25% = risk
  checkin_overdue_days integer NOT NULL DEFAULT 7,       -- days before escalation
  risk_days_before_escalation integer NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

ALTER TABLE public.okr_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage OKR settings"
ON public.okr_settings FOR ALL
USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Members can view OKR settings"
ON public.okr_settings FOR SELECT
USING (is_company_member(auth.uid(), company_id));

-- 2. Check-ins table
CREATE TABLE public.okr_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_result_id uuid NOT NULL REFERENCES public.key_results(id) ON DELETE CASCADE,
  objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id),
  previous_value numeric NOT NULL DEFAULT 0,
  new_value numeric NOT NULL,
  comment text NOT NULL,
  perceived_risk text NOT NULL DEFAULT 'green', -- green, yellow, red
  has_blocker boolean NOT NULL DEFAULT false,
  blocker_description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.okr_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create checkins on their KRs"
ON public.okr_checkins FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND is_company_member(auth.uid(), company_id)
);

CREATE POLICY "Members can view company checkins"
ON public.okr_checkins FOR SELECT
USING (is_company_member(auth.uid(), company_id));

-- 3. Audit log table
CREATE TABLE public.okr_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_type text NOT NULL, -- objective, key_result, objective_relation
  entity_id uuid NOT NULL,
  action text NOT NULL, -- created, updated, deleted
  field_changed text,
  old_value text,
  new_value text,
  changed_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.okr_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
ON public.okr_audit_log FOR SELECT
USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Members can insert audit entries"
ON public.okr_audit_log FOR INSERT
WITH CHECK (is_company_member(auth.uid(), company_id) AND changed_by = auth.uid());

-- 4. Add checkin tracking columns to key_results
ALTER TABLE public.key_results
  ADD COLUMN IF NOT EXISTS last_checkin_at timestamptz,
  ADD COLUMN IF NOT EXISTS checkin_frequency text DEFAULT 'weekly';

-- 5. Add auto-status columns to objectives
ALTER TABLE public.objectives
  ADD COLUMN IF NOT EXISTS auto_status text DEFAULT 'on_track',
  ADD COLUMN IF NOT EXISTS expected_progress numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_status_check timestamptz;

-- 6. Function: Calculate expected progress based on period
CREATE OR REPLACE FUNCTION public.calculate_expected_progress(
  p_period_id uuid,
  p_due_date date DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_date date;
  v_end_date date;
  v_total_days numeric;
  v_elapsed_days numeric;
BEGIN
  IF p_period_id IS NOT NULL THEN
    SELECT start_date, end_date INTO v_start_date, v_end_date
    FROM public.periods WHERE id = p_period_id;
  END IF;

  IF v_start_date IS NULL AND p_due_date IS NOT NULL THEN
    -- Fallback: assume 90-day period ending at due_date
    v_end_date := p_due_date;
    v_start_date := p_due_date - INTERVAL '90 days';
  END IF;

  IF v_start_date IS NULL OR v_end_date IS NULL THEN
    RETURN 0;
  END IF;

  v_total_days := GREATEST(1, v_end_date - v_start_date);
  v_elapsed_days := GREATEST(0, LEAST(now()::date - v_start_date, v_total_days));

  RETURN ROUND((v_elapsed_days / v_total_days) * 100, 1);
END;
$$;

-- 7. Function: Determine auto-status based on deviation
CREATE OR REPLACE FUNCTION public.determine_objective_auto_status(
  p_progress numeric,
  p_expected_progress numeric,
  p_last_checkin_at timestamptz,
  p_checkin_overdue_days integer DEFAULT 7,
  p_deviation_attention numeric DEFAULT 10,
  p_deviation_risk numeric DEFAULT 25
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deviation numeric;
  v_days_since_checkin integer;
BEGIN
  -- Check if checkin is overdue
  IF p_last_checkin_at IS NOT NULL THEN
    v_days_since_checkin := EXTRACT(DAY FROM now() - p_last_checkin_at);
    IF v_days_since_checkin > p_checkin_overdue_days THEN
      RETURN 'overdue';
    END IF;
  ELSIF p_expected_progress > 10 THEN
    -- No checkin ever and we're past 10% expected = overdue
    RETURN 'overdue';
  END IF;

  -- Calculate deviation
  IF p_expected_progress <= 0 THEN
    RETURN 'on_track';
  END IF;

  v_deviation := p_expected_progress - p_progress;

  IF v_deviation <= 0 THEN
    RETURN 'on_track';
  ELSIF v_deviation <= p_deviation_attention THEN
    RETURN 'on_track';
  ELSIF v_deviation <= p_deviation_risk THEN
    RETURN 'attention';
  ELSE
    RETURN 'risk';
  END IF;
END;
$$;

-- 8. Function: Update objective auto-status (called by trigger or cron)
CREATE OR REPLACE FUNCTION public.update_objective_auto_status(p_objective_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Skip completed/canceled
  IF v_obj.status IN ('completed', 'canceled') THEN
    UPDATE public.objectives SET auto_status = v_obj.status::text, last_status_check = now()
    WHERE id = p_objective_id;
    RETURN;
  END IF;

  -- Get company settings
  SELECT * INTO v_settings FROM public.okr_settings WHERE company_id = v_obj.company_id;

  -- Calculate expected progress
  v_expected := public.calculate_expected_progress(v_obj.period_id, v_obj.due_date);

  -- Get last checkin for this objective's KRs
  SELECT MAX(last_checkin_at) INTO v_last_checkin
  FROM public.key_results WHERE objective_id = p_objective_id;

  -- Check if operational objective has KRs
  IF v_obj.type = 'operational' THEN
    SELECT EXISTS(SELECT 1 FROM public.key_results WHERE objective_id = p_objective_id) INTO v_has_krs;
    IF NOT v_has_krs THEN
      v_auto_status := 'risk'; -- No KRs = automatic risk
    ELSE
      v_auto_status := public.determine_objective_auto_status(
        v_obj.progress,
        v_expected,
        v_last_checkin,
        COALESCE(v_settings.checkin_overdue_days, 7),
        COALESCE(v_settings.deviation_attention_pct, 10),
        COALESCE(v_settings.deviation_risk_pct, 25)
      );
    END IF;
  ELSE
    -- Parent objectives: status from children
    v_auto_status := public.determine_objective_auto_status(
      v_obj.progress,
      v_expected,
      v_last_checkin,
      COALESCE(v_settings.checkin_overdue_days, 7),
      COALESCE(v_settings.deviation_attention_pct, 10),
      COALESCE(v_settings.deviation_risk_pct, 25)
    );
  END IF;

  UPDATE public.objectives
  SET auto_status = v_auto_status,
      expected_progress = v_expected,
      last_status_check = now()
  WHERE id = p_objective_id;
END;
$$;

-- 9. Trigger: After check-in insert, update KR value + cascade + auto-status
CREATE OR REPLACE FUNCTION public.process_okr_checkin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the KR current_value
  UPDATE public.key_results
  SET current_value = NEW.new_value,
      last_checkin_at = NEW.created_at,
      updated_at = now()
  WHERE id = NEW.key_result_id;

  -- The existing trigger on key_results will cascade progress up
  -- Now update auto-status for the objective
  PERFORM public.update_objective_auto_status(NEW.objective_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_process_okr_checkin
AFTER INSERT ON public.okr_checkins
FOR EACH ROW
EXECUTE FUNCTION public.process_okr_checkin();

-- 10. Trigger: Audit log for objectives changes
CREATE OR REPLACE FUNCTION public.audit_objective_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.title IS DISTINCT FROM NEW.title THEN
      INSERT INTO public.okr_audit_log(company_id, entity_type, entity_id, action, field_changed, old_value, new_value, changed_by)
      VALUES (NEW.company_id, 'objective', NEW.id, 'updated', 'title', OLD.title, NEW.title, auth.uid());
    END IF;
    IF OLD.owner_id IS DISTINCT FROM NEW.owner_id THEN
      INSERT INTO public.okr_audit_log(company_id, entity_type, entity_id, action, field_changed, old_value, new_value, changed_by)
      VALUES (NEW.company_id, 'objective', NEW.id, 'updated', 'owner_id', OLD.owner_id::text, NEW.owner_id::text, auth.uid());
    END IF;
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.okr_audit_log(company_id, entity_type, entity_id, action, field_changed, old_value, new_value, changed_by)
      VALUES (NEW.company_id, 'objective', NEW.id, 'updated', 'status', OLD.status::text, NEW.status::text, auth.uid());
    END IF;
    IF OLD.parent_id IS DISTINCT FROM NEW.parent_id THEN
      INSERT INTO public.okr_audit_log(company_id, entity_type, entity_id, action, field_changed, old_value, new_value, changed_by)
      VALUES (NEW.company_id, 'objective', NEW.id, 'updated', 'parent_id', OLD.parent_id::text, NEW.parent_id::text, auth.uid());
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.okr_audit_log(company_id, entity_type, entity_id, action, field_changed, old_value, new_value, changed_by)
    VALUES (NEW.company_id, 'objective', NEW.id, 'created', NULL, NULL, NEW.title, NEW.created_by);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.okr_audit_log(company_id, entity_type, entity_id, action, field_changed, old_value, new_value, changed_by)
    VALUES (OLD.company_id, 'objective', OLD.id, 'deleted', NULL, OLD.title, NULL, auth.uid());
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_audit_objectives
AFTER INSERT OR UPDATE OR DELETE ON public.objectives
FOR EACH ROW
EXECUTE FUNCTION public.audit_objective_changes();

-- 11. Trigger: Audit log for key_results changes
CREATE OR REPLACE FUNCTION public.audit_key_result_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  SELECT company_id INTO v_company_id
  FROM public.objectives WHERE id = COALESCE(NEW.objective_id, OLD.objective_id);

  IF TG_OP = 'UPDATE' THEN
    IF OLD.target_value IS DISTINCT FROM NEW.target_value THEN
      INSERT INTO public.okr_audit_log(company_id, entity_type, entity_id, action, field_changed, old_value, new_value, changed_by)
      VALUES (v_company_id, 'key_result', NEW.id, 'updated', 'target_value', OLD.target_value::text, NEW.target_value::text, auth.uid());
    END IF;
    IF OLD.weight_percentage IS DISTINCT FROM NEW.weight_percentage THEN
      INSERT INTO public.okr_audit_log(company_id, entity_type, entity_id, action, field_changed, old_value, new_value, changed_by)
      VALUES (v_company_id, 'key_result', NEW.id, 'updated', 'weight_percentage', OLD.weight_percentage::text, NEW.weight_percentage::text, auth.uid());
    END IF;
    IF OLD.owner_user_id IS DISTINCT FROM NEW.owner_user_id THEN
      INSERT INTO public.okr_audit_log(company_id, entity_type, entity_id, action, field_changed, old_value, new_value, changed_by)
      VALUES (v_company_id, 'key_result', NEW.id, 'updated', 'owner_user_id', OLD.owner_user_id::text, NEW.owner_user_id::text, auth.uid());
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.okr_audit_log(company_id, entity_type, entity_id, action, field_changed, old_value, new_value, changed_by)
    VALUES (v_company_id, 'key_result', NEW.id, 'created', NULL, NULL, NEW.title, auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.okr_audit_log(company_id, entity_type, entity_id, action, field_changed, old_value, new_value, changed_by)
    VALUES (v_company_id, 'key_result', OLD.id, 'deleted', NULL, OLD.title, NULL, auth.uid());
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_audit_key_results
AFTER INSERT OR UPDATE OR DELETE ON public.key_results
FOR EACH ROW
EXECUTE FUNCTION public.audit_key_result_changes();

-- 12. Enable realtime for checkins
ALTER PUBLICATION supabase_realtime ADD TABLE public.okr_checkins;

-- 13. Validation function: Block manual progress changes on objectives
CREATE OR REPLACE FUNCTION public.block_manual_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only the system (via triggers) should update progress
  -- Block if progress is changed but not from update_objective_progress or cascade
  IF OLD.progress IS DISTINCT FROM NEW.progress THEN
    -- Allow if status is being set to completed (admin override)
    IF NEW.status = 'completed' THEN
      RETURN NEW;
    END IF;
    -- Allow system calls (session variable set by triggers)
    IF current_setting('app.system_update', true) = 'true' THEN
      RETURN NEW;
    END IF;
    -- Otherwise, revert progress to old value
    NEW.progress := OLD.progress;
  END IF;
  RETURN NEW;
END;
$$;

-- Note: Not enabling block_manual_progress trigger yet as current triggers
-- don't set session variables. This needs careful integration.
-- The validation will be enforced at the application layer initially.
