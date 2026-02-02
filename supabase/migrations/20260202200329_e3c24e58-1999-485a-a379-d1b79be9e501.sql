-- Add new columns to objectives table
ALTER TABLE public.objectives 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS period text,
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS tags text[];

-- Create objective_collaborators table for contributors and editors
CREATE TABLE public.objective_collaborators (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('contributor', 'editor')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(objective_id, user_id, role)
);

-- Enable RLS
ALTER TABLE public.objective_collaborators ENABLE ROW LEVEL SECURITY;

-- Create index for better query performance
CREATE INDEX idx_objective_collaborators_objective_id ON public.objective_collaborators(objective_id);
CREATE INDEX idx_objective_collaborators_user_id ON public.objective_collaborators(user_id);

-- RLS Policies for objective_collaborators

-- Members can view collaborators of objectives in their company
CREATE POLICY "Members can view objective collaborators"
ON public.objective_collaborators
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = objective_collaborators.objective_id
    AND is_company_member(auth.uid(), o.company_id)
  )
);

-- Objective owner, admins, or editors can insert collaborators
CREATE POLICY "Authorized users can insert collaborators"
ON public.objective_collaborators
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = objective_collaborators.objective_id
    AND (
      o.owner_id = auth.uid()
      OR o.created_by = auth.uid()
      OR is_company_admin(auth.uid(), o.company_id)
    )
  )
);

-- Objective owner, admins, or editors can delete collaborators
CREATE POLICY "Authorized users can delete collaborators"
ON public.objective_collaborators
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = objective_collaborators.objective_id
    AND (
      o.owner_id = auth.uid()
      OR o.created_by = auth.uid()
      OR is_company_admin(auth.uid(), o.company_id)
    )
  )
);

-- Update objectives RLS to allow editors to update
DROP POLICY IF EXISTS "Update objectives with permissions" ON public.objectives;

CREATE POLICY "Update objectives with permissions"
ON public.objectives
FOR UPDATE
USING (
  is_company_member(auth.uid(), company_id) 
  AND (
    owner_id = auth.uid()
    OR assignee_id = auth.uid()
    OR is_company_admin(auth.uid(), company_id)
    OR (team_id IS NOT NULL AND is_team_leader(auth.uid(), team_id))
    OR EXISTS (
      SELECT 1 FROM public.objective_collaborators oc
      WHERE oc.objective_id = objectives.id
      AND oc.user_id = auth.uid()
      AND oc.role = 'editor'
    )
  )
);