-- =============================================================================
-- 0004 — Pulse Survey: recurring short surveys with longitudinal metrics
-- =============================================================================
-- Sources: brownfield-assessment.md (P0 #6), architecture-review.md §5.6
-- Risk: 🟢 Low — new tables only
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. pulse_surveys — recurring survey definition
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pulse_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.users(id),
  name text NOT NULL,
  question text NOT NULL,
  question_type text NOT NULL DEFAULT 'scale_1_5'
    CHECK (question_type IN ('scale_1_5', 'enps_0_10', 'mood_emoji')),
  frequency text NOT NULL
    CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  day_of_week smallint CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sun
  day_of_month smallint CHECK (day_of_month BETWEEN 1 AND 28),
  send_hour_utc smallint NOT NULL DEFAULT 12 CHECK (send_hour_utc BETWEEN 0 AND 23),
  target_departments uuid[] DEFAULT '{}',
  target_teams uuid[] DEFAULT '{}',
  target_all boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  require_comment_below smallint CHECK (require_comment_below BETWEEN 0 AND 10),
  anonymous boolean NOT NULL DEFAULT false,
  last_dispatched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pulse_surveys_company ON public.pulse_surveys(company_id);
CREATE INDEX IF NOT EXISTS idx_pulse_surveys_active ON public.pulse_surveys(active, last_dispatched_at) WHERE active = true;

ALTER TABLE public.pulse_surveys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view active pulse surveys" ON public.pulse_surveys;
CREATE POLICY "Members view active pulse surveys"
ON public.pulse_surveys FOR SELECT
USING (public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "Admins create pulse surveys" ON public.pulse_surveys;
CREATE POLICY "Admins create pulse surveys"
ON public.pulse_surveys FOR INSERT
WITH CHECK (
  public.is_company_admin(auth.uid(), company_id)
  AND created_by = auth.uid()
);

DROP POLICY IF EXISTS "Admins update pulse surveys" ON public.pulse_surveys;
CREATE POLICY "Admins update pulse surveys"
ON public.pulse_surveys FOR UPDATE
USING (public.is_company_admin(auth.uid(), company_id));

DROP POLICY IF EXISTS "Admins delete pulse surveys" ON public.pulse_surveys;
CREATE POLICY "Admins delete pulse surveys"
ON public.pulse_surveys FOR DELETE
USING (public.is_company_admin(auth.uid(), company_id));

DROP TRIGGER IF EXISTS update_pulse_surveys_updated_at ON public.pulse_surveys;
CREATE TRIGGER update_pulse_surveys_updated_at
  BEFORE UPDATE ON public.pulse_surveys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- -----------------------------------------------------------------------------
-- 2. pulse_responses — one per user per period
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pulse_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pulse_survey_id uuid NOT NULL REFERENCES public.pulse_surveys(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,  -- nullable for anonymous
  period_start date NOT NULL,
  score smallint NOT NULL,
  emoji text,  -- for mood_emoji type
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pulse_responses_unique_user_period
    UNIQUE NULLS NOT DISTINCT (pulse_survey_id, user_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_pulse_responses_survey ON public.pulse_responses(pulse_survey_id, period_start);
CREATE INDEX IF NOT EXISTS idx_pulse_responses_user ON public.pulse_responses(user_id) WHERE user_id IS NOT NULL;

ALTER TABLE public.pulse_responses ENABLE ROW LEVEL SECURITY;

-- SELECT: admins see all (for analytics), users see own
DROP POLICY IF EXISTS "Users see own pulse responses" ON public.pulse_responses;
CREATE POLICY "Users see own pulse responses"
ON public.pulse_responses FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.pulse_surveys ps
    WHERE ps.id = pulse_responses.pulse_survey_id
      AND public.is_company_admin(auth.uid(), ps.company_id)
  )
);

-- INSERT: only the user themself, only if they're a member of the company
DROP POLICY IF EXISTS "Users submit own pulse responses" ON public.pulse_responses;
CREATE POLICY "Users submit own pulse responses"
ON public.pulse_responses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pulse_surveys ps
    WHERE ps.id = pulse_responses.pulse_survey_id
      AND ps.active = true
      AND public.is_company_member(auth.uid(), ps.company_id)
      AND (
        (ps.anonymous = false AND user_id = auth.uid())
        OR (ps.anonymous = true AND user_id IS NULL)
      )
  )
);

-- UPDATE: nope (immutable once submitted)
-- DELETE: only admin (data cleanup)
DROP POLICY IF EXISTS "Admins delete pulse responses" ON public.pulse_responses;
CREATE POLICY "Admins delete pulse responses"
ON public.pulse_responses FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.pulse_surveys ps
  WHERE ps.id = pulse_responses.pulse_survey_id
    AND public.is_company_admin(auth.uid(), ps.company_id)
));

-- =============================================================================
-- END 0004
-- =============================================================================
