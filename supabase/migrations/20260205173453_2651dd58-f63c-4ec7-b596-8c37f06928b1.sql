-- Adicionar os novos valores ao enum performance_cycle_type
ALTER TYPE public.performance_cycle_type ADD VALUE IF NOT EXISTS 'full';
ALTER TYPE public.performance_cycle_type ADD VALUE IF NOT EXISTS 'pocket';