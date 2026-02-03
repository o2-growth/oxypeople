-- Add target_users column to nps_surveys table
ALTER TABLE public.nps_surveys 
ADD COLUMN target_users UUID[] DEFAULT '{}'::uuid[];