-- Create gamification_points table to track user actions
CREATE TABLE public.gamification_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL,
  points integer NOT NULL,
  reference_id uuid,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for faster queries
CREATE INDEX idx_gamification_points_user_company ON public.gamification_points(user_id, company_id);
CREATE INDEX idx_gamification_points_created_at ON public.gamification_points(created_at DESC);

-- Enable RLS
ALTER TABLE public.gamification_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Members can view all points in their company
CREATE POLICY "Members can view company points"
ON public.gamification_points
FOR SELECT
USING (is_company_member(auth.uid(), company_id));

-- Users can insert their own points (for client-side tracking)
CREATE POLICY "Users can insert own points"
ON public.gamification_points
FOR INSERT
WITH CHECK (user_id = auth.uid() AND is_company_member(auth.uid(), company_id));

-- Create gamification_levels table for level configuration
CREATE TABLE public.gamification_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  min_points integer NOT NULL,
  badge_emoji text,
  color text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.gamification_levels ENABLE ROW LEVEL SECURITY;

-- Members can view levels
CREATE POLICY "Members can view company levels"
ON public.gamification_levels
FOR SELECT
USING (is_company_member(auth.uid(), company_id));

-- Admins can manage levels
CREATE POLICY "Admins can manage levels"
ON public.gamification_levels
FOR ALL
USING (is_company_admin(auth.uid(), company_id));