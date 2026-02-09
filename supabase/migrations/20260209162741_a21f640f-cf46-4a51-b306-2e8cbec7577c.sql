
-- Create actions table for weekly kanban board
CREATE TABLE public.actions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  objective_id uuid REFERENCES public.objectives(id) ON DELETE SET NULL,
  key_result_id uuid REFERENCES public.key_results(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  owner_user_id uuid NOT NULL REFERENCES public.users(id),
  created_by uuid NOT NULL REFERENCES public.users(id),
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done', 'blocked')),
  week_bucket text NOT NULL, -- e.g. '2026-W06'
  order_index integer NOT NULL DEFAULT 0,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

-- Members can view company actions
CREATE POLICY "Members can view company actions"
  ON public.actions FOR SELECT
  USING (is_company_member(auth.uid(), company_id));

-- Members can create actions
CREATE POLICY "Members can create actions"
  ON public.actions FOR INSERT
  WITH CHECK (is_company_member(auth.uid(), company_id) AND created_by = auth.uid());

-- Owner, creator or admin can update
CREATE POLICY "Authorized users can update actions"
  ON public.actions FOR UPDATE
  USING (owner_user_id = auth.uid() OR created_by = auth.uid() OR is_company_admin(auth.uid(), company_id));

-- Owner, creator or admin can delete
CREATE POLICY "Authorized users can delete actions"
  ON public.actions FOR DELETE
  USING (owner_user_id = auth.uid() OR created_by = auth.uid() OR is_company_admin(auth.uid(), company_id));

-- Index for common queries
CREATE INDEX idx_actions_company_week ON public.actions(company_id, week_bucket);
CREATE INDEX idx_actions_objective ON public.actions(objective_id);
CREATE INDEX idx_actions_owner ON public.actions(owner_user_id);

-- Updated_at trigger
CREATE TRIGGER update_actions_updated_at
  BEFORE UPDATE ON public.actions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
