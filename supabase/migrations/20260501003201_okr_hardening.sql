-- =============================================================================
-- 0003 — OKR hardening: comments, confidence, commitment_type
-- =============================================================================
-- Sources: brownfield-assessment.md §5.1 (OKRs gaps)
-- Risk: 🟢 Low — additive columns + new table
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. key_results: confidence (0-100)
-- -----------------------------------------------------------------------------
ALTER TABLE public.key_results
  ADD COLUMN IF NOT EXISTS confidence smallint
    CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 100);

COMMENT ON COLUMN public.key_results.confidence IS
  'KR owner confidence in achieving the target, 0-100. NULL = not set';

-- -----------------------------------------------------------------------------
-- 2. objectives: commitment_type (committed / aspirational)
-- -----------------------------------------------------------------------------
ALTER TABLE public.objectives
  ADD COLUMN IF NOT EXISTS commitment_type text
    NOT NULL DEFAULT 'committed'
    CHECK (commitment_type IN ('committed', 'aspirational'));

COMMENT ON COLUMN public.objectives.commitment_type IS
  'committed = expected to deliver; aspirational = moonshot, excluded from average';

CREATE INDEX IF NOT EXISTS idx_objectives_commitment
  ON public.objectives(company_id, commitment_type);

-- -----------------------------------------------------------------------------
-- 3. objectives: ensure soft delete column exists (idempotent)
-- -----------------------------------------------------------------------------
ALTER TABLE public.objectives
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- -----------------------------------------------------------------------------
-- 4. New table: objective_comments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.objective_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id uuid NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  key_result_id uuid REFERENCES public.key_results(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES public.objective_comments(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.users(id),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_obj_comments_objective ON public.objective_comments(objective_id);
CREATE INDEX IF NOT EXISTS idx_obj_comments_kr ON public.objective_comments(key_result_id) WHERE key_result_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_obj_comments_parent ON public.objective_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_obj_comments_author ON public.objective_comments(author_id);

ALTER TABLE public.objective_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view objective comments" ON public.objective_comments;
CREATE POLICY "Members view objective comments"
ON public.objective_comments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.objectives o
  WHERE o.id = objective_comments.objective_id
    AND public.is_company_member(auth.uid(), o.company_id)
));

DROP POLICY IF EXISTS "Members create objective comments" ON public.objective_comments;
CREATE POLICY "Members create objective comments"
ON public.objective_comments FOR INSERT
WITH CHECK (
  author_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = objective_comments.objective_id
      AND public.is_company_member(auth.uid(), o.company_id)
  )
);

DROP POLICY IF EXISTS "Author can update own comment" ON public.objective_comments;
CREATE POLICY "Author can update own comment"
ON public.objective_comments FOR UPDATE
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Author or admin can delete comment" ON public.objective_comments;
CREATE POLICY "Author or admin can delete comment"
ON public.objective_comments FOR DELETE
USING (
  author_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = objective_comments.objective_id
      AND public.is_company_admin(auth.uid(), o.company_id)
  )
);

-- updated_at trigger
DROP TRIGGER IF EXISTS update_obj_comments_updated_at ON public.objective_comments;
CREATE TRIGGER update_obj_comments_updated_at
  BEFORE UPDATE ON public.objective_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'objective_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.objective_comments;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 5. periods: validation trigger to prevent overlap (admin-only via RLS upstream)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_period_no_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.start_date >= NEW.end_date THEN
    RAISE EXCEPTION 'Period start_date must be before end_date';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.periods
    WHERE company_id = NEW.company_id
      AND id <> COALESCE(NEW.id, gen_random_uuid())
      AND (
        (NEW.start_date BETWEEN start_date AND end_date)
        OR (NEW.end_date BETWEEN start_date AND end_date)
        OR (start_date BETWEEN NEW.start_date AND NEW.end_date)
      )
  ) THEN
    RAISE EXCEPTION 'Period dates overlap with existing period in this company';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_period_no_overlap ON public.periods;
CREATE TRIGGER trg_validate_period_no_overlap
  BEFORE INSERT OR UPDATE OF start_date, end_date, company_id ON public.periods
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_period_no_overlap();

-- =============================================================================
-- END 0003
-- =============================================================================
