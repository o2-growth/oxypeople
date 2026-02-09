
-- Add new objective_type values
ALTER TYPE objective_type ADD VALUE IF NOT EXISTS 'strategic';
ALTER TYPE objective_type ADD VALUE IF NOT EXISTS 'tactical';
ALTER TYPE objective_type ADD VALUE IF NOT EXISTS 'operational';
