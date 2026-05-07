-- =============================================================================
-- P2 polish: drop duplicate audit triggers, allow audit rows from system,
-- ensure every company has an okr_settings row (and create on insert).
-- =============================================================================
-- Risk: 🟢 Low — idempotent and additive.
-- =============================================================================

-- 1) Remove duplicate audit triggers --------------------------------------------
-- Two CREATE TRIGGER statements landed for the same function in different
-- migrations (`trg_audit_objectives` + `trigger_audit_objectives`, same for
-- key_results). Drop the older `trigger_*` form, keep `trg_*`.
DROP TRIGGER IF EXISTS trigger_audit_objectives ON public.objectives;
DROP TRIGGER IF EXISTS trigger_audit_key_results ON public.key_results;

-- 2) Allow service-role / system writes that have a NULL auth.uid() ------------
-- The audit log enforced changed_by NOT NULL; any seed / cron / RPC executing
-- without a JWT failed to mutate objectives/KRs. Make it nullable; we still
-- record the user when available.
ALTER TABLE public.okr_audit_log
  ALTER COLUMN changed_by DROP NOT NULL;

-- 3) Default okr_settings row per company --------------------------------------
-- Backfill: any company missing a row gets a default one.
INSERT INTO public.okr_settings (company_id, checkin_min_chars)
SELECT c.id, 10
FROM public.companies c
LEFT JOIN public.okr_settings s ON s.company_id = c.id
WHERE s.company_id IS NULL;

-- Trigger: when a new company is created, seed an okr_settings row.
CREATE OR REPLACE FUNCTION public.seed_okr_settings_for_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.okr_settings (company_id)
  VALUES (NEW.id)
  ON CONFLICT (company_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_okr_settings ON public.companies;
CREATE TRIGGER trg_seed_okr_settings
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_okr_settings_for_company();
