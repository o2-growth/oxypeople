
-- =============================================
-- Estado atual: policies já foram dropadas, enum type já foi alterado,
-- mas periods, objective_relations não foram criados, e os inserts falharam.
-- Vamos verificar e criar o que falta.
-- =============================================

-- PARTE 3: Tabela de Períodos (se não existe)
CREATE TABLE IF NOT EXISTS public.periods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist before creating
DROP POLICY IF EXISTS "Members can view company periods" ON public.periods;
DROP POLICY IF EXISTS "Admins can manage periods" ON public.periods;

CREATE POLICY "Members can view company periods"
  ON public.periods FOR SELECT
  USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Admins can manage periods"
  ON public.periods FOR ALL
  USING (is_company_admin(auth.uid(), company_id));

-- PARTE 4: Modificar tabela objectives
ALTER TABLE public.objectives
  ADD COLUMN IF NOT EXISTS owner_department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS period_id uuid REFERENCES public.periods(id) ON DELETE SET NULL;

ALTER TABLE public.objectives DROP COLUMN IF EXISTS period;

-- Recriar policies que foram dropadas (verificar se não existem)
DROP POLICY IF EXISTS "Create objectives with permissions" ON public.objectives;
DROP POLICY IF EXISTS "Delete objectives with permissions" ON public.objectives;
DROP POLICY IF EXISTS "Update objectives with permissions" ON public.objectives;
DROP POLICY IF EXISTS "View objectives with permissions" ON public.objectives;

CREATE POLICY "Create objectives with permissions"
  ON public.objectives FOR INSERT
  WITH CHECK (
    is_company_member(auth.uid(), company_id)
    AND created_by = auth.uid()
    AND (
      (owner_id = auth.uid())
      OR is_company_admin(auth.uid(), company_id)
      OR (team_id IS NOT NULL AND is_team_leader(auth.uid(), team_id))
      OR (assignee_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM team_members tm1
        JOIN team_members tm2 ON tm1.team_id = tm2.team_id
        WHERE tm1.user_id = auth.uid() AND tm1.role = 'leader' AND tm2.user_id = objectives.assignee_id
      ))
    )
  );

CREATE POLICY "Delete objectives with permissions"
  ON public.objectives FOR DELETE
  USING (
    is_company_member(auth.uid(), company_id)
    AND (created_by = auth.uid() OR is_company_admin(auth.uid(), company_id))
  );

CREATE POLICY "Update objectives with permissions"
  ON public.objectives FOR UPDATE
  USING (
    is_company_member(auth.uid(), company_id)
    AND (
      owner_id = auth.uid()
      OR assignee_id = auth.uid()
      OR is_company_admin(auth.uid(), company_id)
      OR (team_id IS NOT NULL AND is_team_leader(auth.uid(), team_id))
      OR EXISTS (
        SELECT 1 FROM objective_collaborators oc
        WHERE oc.objective_id = objectives.id AND oc.user_id = auth.uid() AND oc.role = 'editor'
      )
    )
  );

CREATE POLICY "View objectives with permissions"
  ON public.objectives FOR SELECT
  USING (
    is_company_member(auth.uid(), company_id)
    AND (
      owner_id = auth.uid()
      OR assignee_id = auth.uid()
      OR visibility = 'company'::post_visibility
      OR (team_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM team_members WHERE team_id = objectives.team_id AND user_id = auth.uid()
      ))
    )
  );

-- Atualizar status enum
ALTER TABLE public.objectives ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.objectives ALTER COLUMN status TYPE text;
DROP TYPE IF EXISTS public.objective_status;
CREATE TYPE public.objective_status AS ENUM ('planned', 'active', 'risk', 'completed', 'canceled');
ALTER TABLE public.objectives ALTER COLUMN status TYPE public.objective_status USING 'planned'::public.objective_status;
ALTER TABLE public.objectives ALTER COLUMN status SET DEFAULT 'planned'::public.objective_status;

-- PARTE 5: Tabela ObjectiveRelation
CREATE TABLE IF NOT EXISTS public.objective_relations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  child_objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  weight_percentage numeric NOT NULL DEFAULT 0 CHECK (weight_percentage >= 0 AND weight_percentage <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parent_objective_id, child_objective_id),
  CHECK (parent_objective_id != child_objective_id)
);

ALTER TABLE public.objective_relations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view objective relations" ON public.objective_relations;
DROP POLICY IF EXISTS "Authorized users can manage relations" ON public.objective_relations;

CREATE POLICY "Members can view objective relations"
  ON public.objective_relations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = objective_relations.parent_objective_id
    AND is_company_member(auth.uid(), o.company_id)
  ));

CREATE POLICY "Authorized users can manage relations"
  ON public.objective_relations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = objective_relations.parent_objective_id
    AND (o.owner_id = auth.uid() OR is_company_admin(auth.uid(), o.company_id))
  ));

-- PARTE 6: Modificar key_results
ALTER TABLE public.key_results
  ADD COLUMN IF NOT EXISTS kr_type text NOT NULL DEFAULT 'numeric',
  ADD COLUMN IF NOT EXISTS initial_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weight_percentage numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_automatic boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'on_track',
  ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- PARTE 7: Triggers
CREATE OR REPLACE FUNCTION public.update_objective_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_objective_id uuid;
  v_new_progress integer;
  v_parent_id uuid;
  v_total_weight numeric;
BEGIN
  v_objective_id := COALESCE(NEW.objective_id, OLD.objective_id);
  SELECT INTO v_total_weight COALESCE(SUM(weight_percentage), 0)
  FROM public.key_results WHERE objective_id = v_objective_id;

  IF v_total_weight > 0 THEN
    SELECT INTO v_new_progress COALESCE(
      (SUM(
        LEAST(100, 
          CASE 
            WHEN kr_type = 'binary' THEN CASE WHEN current_value >= target_value THEN 100 ELSE 0 END
            WHEN NULLIF(target_value - initial_value, 0) IS NULL THEN 0
            ELSE ((current_value - initial_value)::numeric / (target_value - initial_value)::numeric) * 100
          END
        ) * weight_percentage
      ) / NULLIF(SUM(weight_percentage), 0))::integer, 0
    ) FROM public.key_results WHERE objective_id = v_objective_id;
  ELSE
    v_new_progress := 0;
  END IF;

  UPDATE public.objectives SET progress = v_new_progress, updated_at = now() WHERE id = v_objective_id;

  SELECT parent_id INTO v_parent_id FROM public.objectives WHERE id = v_objective_id;
  IF v_parent_id IS NOT NULL THEN
    PERFORM public.cascade_objective_progress(v_parent_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cascade_objective_progress(p_objective_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_progress integer;
  v_parent_id uuid;
  v_has_relations boolean;
  v_has_children boolean;
  v_total_weight numeric;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.objective_relations WHERE parent_objective_id = p_objective_id) INTO v_has_relations;

  IF v_has_relations THEN
    SELECT INTO v_total_weight COALESCE(SUM(weight_percentage), 0)
    FROM public.objective_relations WHERE parent_objective_id = p_objective_id;

    IF v_total_weight > 0 THEN
      SELECT INTO v_new_progress COALESCE(
        (SUM(o.progress * r.weight_percentage) / NULLIF(SUM(r.weight_percentage), 0))::integer, 0
      ) FROM public.objective_relations r
      JOIN public.objectives o ON o.id = r.child_objective_id
      WHERE r.parent_objective_id = p_objective_id;
    ELSE
      SELECT INTO v_new_progress COALESCE(AVG(o.progress)::integer, 0)
      FROM public.objective_relations r
      JOIN public.objectives o ON o.id = r.child_objective_id
      WHERE r.parent_objective_id = p_objective_id;
    END IF;
  ELSE
    SELECT EXISTS(SELECT 1 FROM public.objectives WHERE parent_id = p_objective_id) INTO v_has_children;
    IF v_has_children THEN
      SELECT INTO v_new_progress COALESCE(AVG(progress)::integer, 0)
      FROM public.objectives WHERE parent_id = p_objective_id;
    ELSE
      RETURN;
    END IF;
  END IF;

  UPDATE public.objectives SET progress = v_new_progress, updated_at = now() WHERE id = p_objective_id;

  SELECT parent_id INTO v_parent_id FROM public.objectives WHERE id = p_objective_id;
  IF v_parent_id IS NOT NULL THEN
    PERFORM public.cascade_objective_progress(v_parent_id);
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS update_objective_progress ON public.key_results;
CREATE TRIGGER update_objective_progress
  AFTER INSERT OR UPDATE OR DELETE ON public.key_results
  FOR EACH ROW EXECUTE FUNCTION public.update_objective_progress();

CREATE OR REPLACE FUNCTION public.cascade_on_objective_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.progress IS DISTINCT FROM OLD.progress AND NEW.parent_id IS NOT NULL THEN
    PERFORM public.cascade_objective_progress(NEW.parent_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cascade_objective_progress_trigger ON public.objectives;
CREATE TRIGGER cascade_objective_progress_trigger
  AFTER UPDATE ON public.objectives
  FOR EACH ROW EXECUTE FUNCTION public.cascade_on_objective_update();
