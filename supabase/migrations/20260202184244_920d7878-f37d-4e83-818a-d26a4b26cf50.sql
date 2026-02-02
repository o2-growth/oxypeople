-- Create enum for objective types
CREATE TYPE public.objective_type AS ENUM ('personal', 'team', 'individual');

-- Add new columns to objectives table
ALTER TABLE public.objectives 
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS type public.objective_type NOT NULL DEFAULT 'personal';

-- Update existing rows to set created_by = owner_id
UPDATE public.objectives SET created_by = owner_id WHERE created_by IS NULL;

-- Make created_by NOT NULL after populating
ALTER TABLE public.objectives ALTER COLUMN created_by SET NOT NULL;

-- Create function to check if user is team leader
CREATE OR REPLACE FUNCTION public.is_team_leader(p_user_id uuid, p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE user_id = p_user_id
    AND team_id = p_team_id
    AND role = 'leader'
  )
$$;

-- Create function to check if user leads any team
CREATE OR REPLACE FUNCTION public.is_any_team_leader(p_user_id uuid, p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.teams t ON tm.team_id = t.id
    WHERE tm.user_id = p_user_id
    AND tm.role = 'leader'
    AND t.company_id = p_company_id
  )
$$;

-- Create function to get teams user leads
CREATE OR REPLACE FUNCTION public.get_led_teams(p_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.team_members
  WHERE user_id = p_user_id
  AND role = 'leader'
$$;

-- Create function to update objective progress based on key results
CREATE OR REPLACE FUNCTION public.update_objective_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.objectives
  SET progress = (
    SELECT COALESCE(
      AVG(
        LEAST(100, (current_value::numeric / NULLIF(target_value::numeric, 0)) * 100)
      )::integer,
      0
    )
    FROM public.key_results
    WHERE objective_id = COALESCE(NEW.objective_id, OLD.objective_id)
  ),
  updated_at = now()
  WHERE id = COALESCE(NEW.objective_id, OLD.objective_id);
  RETURN NEW;
END;
$$;

-- Create trigger to auto-update objective progress when key_results change
DROP TRIGGER IF EXISTS trigger_update_objective_progress ON public.key_results;
CREATE TRIGGER trigger_update_objective_progress
AFTER INSERT OR UPDATE OR DELETE ON public.key_results
FOR EACH ROW
EXECUTE FUNCTION public.update_objective_progress();

-- Drop existing RLS policies on objectives to replace them
DROP POLICY IF EXISTS "Members can view company objectives" ON public.objectives;
DROP POLICY IF EXISTS "Members can create objectives" ON public.objectives;
DROP POLICY IF EXISTS "Owners can update objectives" ON public.objectives;
DROP POLICY IF EXISTS "Owners can delete objectives" ON public.objectives;

-- New SELECT policy: view objectives based on permissions
CREATE POLICY "View objectives with permissions"
ON public.objectives FOR SELECT
USING (
  is_company_member(auth.uid(), company_id)
  AND (
    -- Owner can see their own
    owner_id = auth.uid()
    -- Assignee can see assigned to them
    OR assignee_id = auth.uid()
    -- Company visibility
    OR visibility = 'company'
    -- Team members can see team objectives
    OR (
      team_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_id = objectives.team_id
        AND user_id = auth.uid()
      )
    )
  )
);

-- New INSERT policy: create objectives based on role
CREATE POLICY "Create objectives with permissions"
ON public.objectives FOR INSERT
WITH CHECK (
  is_company_member(auth.uid(), company_id)
  AND created_by = auth.uid()
  AND (
    -- Personal objectives: for yourself only
    (type = 'personal' AND owner_id = auth.uid() AND (assignee_id IS NULL OR assignee_id = auth.uid()))
    -- Admins can create any objective
    OR is_company_admin(auth.uid(), company_id)
    -- Team leaders can create team objectives for their teams
    OR (
      type = 'team'
      AND team_id IS NOT NULL
      AND is_team_leader(auth.uid(), team_id)
    )
    -- Team leaders can create individual objectives for their team members
    OR (
      type = 'individual'
      AND assignee_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.team_members tm1
        JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
        WHERE tm1.user_id = auth.uid()
        AND tm1.role = 'leader'
        AND tm2.user_id = objectives.assignee_id
      )
    )
  )
);

-- New UPDATE policy: update based on ownership or admin
CREATE POLICY "Update objectives with permissions"
ON public.objectives FOR UPDATE
USING (
  is_company_member(auth.uid(), company_id)
  AND (
    -- Owner can update
    owner_id = auth.uid()
    -- Assignee can update (for progress)
    OR assignee_id = auth.uid()
    -- Admins can update any
    OR is_company_admin(auth.uid(), company_id)
    -- Team leaders can update team objectives
    OR (
      team_id IS NOT NULL
      AND is_team_leader(auth.uid(), team_id)
    )
  )
);

-- New DELETE policy: delete based on ownership or admin
CREATE POLICY "Delete objectives with permissions"
ON public.objectives FOR DELETE
USING (
  is_company_member(auth.uid(), company_id)
  AND (
    -- Creator can delete
    created_by = auth.uid()
    -- Admins can delete any
    OR is_company_admin(auth.uid(), company_id)
  )
);