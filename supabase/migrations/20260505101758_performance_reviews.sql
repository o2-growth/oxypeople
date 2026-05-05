-- =============================================================================
-- Performance Reviews — historical reviews imported from external sources (Feedz)
-- =============================================================================
-- Risk: 🟢 Low — new table only, no mutation of existing rows.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  review_name text NOT NULL,
  period_start date,
  period_end date,
  final_score numeric(5,3),
  source text NOT NULL DEFAULT 'manual',
  imported_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT performance_reviews_score_range CHECK (final_score IS NULL OR (final_score >= 0 AND final_score <= 10))
);

-- Idempotent re-imports: same person + same review name + same start date is one row.
CREATE UNIQUE INDEX IF NOT EXISTS uq_performance_reviews_user_review_period
  ON public.performance_reviews (user_id, review_name, COALESCE(period_start, '1900-01-01'::date));

CREATE INDEX IF NOT EXISTS idx_performance_reviews_company ON public.performance_reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_user ON public.performance_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_period_end ON public.performance_reviews(period_end DESC);

ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Self and admins read performance reviews" ON public.performance_reviews;
CREATE POLICY "Self and admins read performance reviews"
ON public.performance_reviews FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_company_admin(auth.uid(), company_id)
  OR public.get_user_role(auth.uid(), company_id) = 'manager'
);

DROP POLICY IF EXISTS "Admins manage performance reviews" ON public.performance_reviews;
CREATE POLICY "Admins manage performance reviews"
ON public.performance_reviews FOR ALL
USING (public.is_company_admin(auth.uid(), company_id))
WITH CHECK (public.is_company_admin(auth.uid(), company_id));

DROP TRIGGER IF EXISTS trg_performance_reviews_updated_at ON public.performance_reviews;
CREATE TRIGGER trg_performance_reviews_updated_at
  BEFORE UPDATE ON public.performance_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
