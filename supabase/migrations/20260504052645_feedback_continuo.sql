-- =============================================================================
-- 0006 — Feedback Contínuo: ad-hoc feedback requests with competency tags
-- =============================================================================
-- Sources: brownfield-assessment.md (P0 #3), architecture-review.md §5.3
-- Risk: 🟢 Low — new tables, RLS by visibility
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. feedback_requests — main entity
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedback_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

  -- Three roles in feedback flow:
  requester_id uuid NOT NULL REFERENCES public.users(id),     -- who initiated the request
  respondent_id uuid NOT NULL REFERENCES public.users(id),    -- who must answer
  subject_user_id uuid NOT NULL REFERENCES public.users(id),  -- who the feedback is ABOUT

  question text NOT NULL CHECK (char_length(question) BETWEEN 1 AND 2000),
  response text CHECK (response IS NULL OR char_length(response) <= 5000),
  competency_tags jsonb NOT NULL DEFAULT '[]'::jsonb,

  visibility text NOT NULL DEFAULT 'shared_with_subject'
    CHECK (visibility IN ('private_requester', 'shared_with_subject', 'shared_with_manager')),

  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'answered', 'declined', 'expired')),

  due_date date,
  answered_at timestamptz,
  declined_reason text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT feedback_requester_not_respondent CHECK (requester_id <> respondent_id OR requester_id = subject_user_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_company ON public.feedback_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_feedback_requester ON public.feedback_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_feedback_respondent ON public.feedback_requests(respondent_id, status);
CREATE INDEX IF NOT EXISTS idx_feedback_subject ON public.feedback_requests(subject_user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback_requests(status, due_date) WHERE status = 'requested';

ALTER TABLE public.feedback_requests ENABLE ROW LEVEL SECURITY;

-- SELECT: requester, respondent, subject always; manager of subject if visibility = shared_with_manager
DROP POLICY IF EXISTS "Feedback parties can view" ON public.feedback_requests;
CREATE POLICY "Feedback parties can view"
ON public.feedback_requests FOR SELECT
USING (
  auth.uid() IN (requester_id, respondent_id)
  OR (
    visibility IN ('shared_with_subject', 'shared_with_manager')
    AND auth.uid() = subject_user_id
  )
  OR (
    visibility = 'shared_with_manager'
    AND public.is_user_manager(auth.uid(), subject_user_id, company_id)
  )
  OR public.is_company_admin(auth.uid(), company_id)
);

-- INSERT: any company member can request feedback
DROP POLICY IF EXISTS "Members create feedback requests" ON public.feedback_requests;
CREATE POLICY "Members create feedback requests"
ON public.feedback_requests FOR INSERT
WITH CHECK (
  requester_id = auth.uid()
  AND public.is_company_member(auth.uid(), company_id)
  AND public.is_company_member(respondent_id, company_id)
  AND public.is_company_member(subject_user_id, company_id)
);

-- UPDATE: only respondent can update (to answer/decline) — and only if still 'requested'
DROP POLICY IF EXISTS "Respondent answers feedback" ON public.feedback_requests;
CREATE POLICY "Respondent answers feedback"
ON public.feedback_requests FOR UPDATE
USING (
  respondent_id = auth.uid()
  AND status = 'requested'
)
WITH CHECK (
  respondent_id = auth.uid()
);

-- DELETE: requester (if still requested) or admin
DROP POLICY IF EXISTS "Requester or admin delete feedback" ON public.feedback_requests;
CREATE POLICY "Requester or admin delete feedback"
ON public.feedback_requests FOR DELETE
USING (
  (requester_id = auth.uid() AND status = 'requested')
  OR public.is_company_admin(auth.uid(), company_id)
);

DROP TRIGGER IF EXISTS update_feedback_updated_at ON public.feedback_requests;
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON public.feedback_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Notification trigger: notify on new request and on answered
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_feedback_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- INSERT: notify respondent
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (company_id, user_id, type, title, message, reference_id, reference_type)
    VALUES (
      NEW.company_id,
      NEW.respondent_id,
      'feedback_request',
      'Você recebeu uma solicitação de feedback',
      LEFT(NEW.question, 200),
      NEW.id,
      'feedback_request'
    );
  END IF;

  -- UPDATE to status='answered': notify requester (and subject if visibility allows)
  IF TG_OP = 'UPDATE' AND OLD.status = 'requested' AND NEW.status = 'answered' THEN
    INSERT INTO public.notifications (company_id, user_id, type, title, message, reference_id, reference_type)
    VALUES (
      NEW.company_id,
      NEW.requester_id,
      'feedback_answered',
      'Seu pedido de feedback foi respondido',
      LEFT(NEW.response, 200),
      NEW.id,
      'feedback_request'
    );

    IF NEW.visibility IN ('shared_with_subject', 'shared_with_manager')
       AND NEW.subject_user_id <> NEW.requester_id THEN
      INSERT INTO public.notifications (company_id, user_id, type, title, message, reference_id, reference_type)
      VALUES (
        NEW.company_id,
        NEW.subject_user_id,
        'feedback_received',
        'Você recebeu um feedback',
        LEFT(NEW.response, 200),
        NEW.id,
        'feedback_request'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_feedback ON public.feedback_requests;
CREATE TRIGGER trg_notify_feedback
  AFTER INSERT OR UPDATE OF status ON public.feedback_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_feedback_event();

-- =============================================================================
-- END 0006
-- =============================================================================
