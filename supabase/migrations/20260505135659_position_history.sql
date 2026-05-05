-- =============================================================================
-- Position History — snapshot of role/department/manager changes per user.
-- =============================================================================
-- Sourced from Feedz "histórico de cargos e salários" export (salary column
-- comes empty in the export, so we don't model it here yet).
-- Risk: 🟢 Low — new table only.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.position_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  department_name text,
  position text,
  manager_name text,
  changed_at date NOT NULL,
  changed_by_name text,
  reason text,
  notes text,
  source text NOT NULL DEFAULT 'manual',
  imported_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- A given person can only have one snapshot for the same role on the same day.
CREATE UNIQUE INDEX IF NOT EXISTS uq_position_history_user_date_role
  ON public.position_history (user_id, changed_at, COALESCE(position, ''));

CREATE INDEX IF NOT EXISTS idx_position_history_company ON public.position_history(company_id);
CREATE INDEX IF NOT EXISTS idx_position_history_user_changed ON public.position_history(user_id, changed_at DESC);

ALTER TABLE public.position_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Self and admins read position history" ON public.position_history;
CREATE POLICY "Self and admins read position history"
ON public.position_history FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_company_admin(auth.uid(), company_id)
  OR public.get_user_role(auth.uid(), company_id) = 'manager'
);

DROP POLICY IF EXISTS "Admins manage position history" ON public.position_history;
CREATE POLICY "Admins manage position history"
ON public.position_history FOR ALL
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));

DROP TRIGGER IF EXISTS trg_position_history_updated_at ON public.position_history;
CREATE TRIGGER trg_position_history_updated_at
  BEFORE UPDATE ON public.position_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
