-- =============================================================================
-- 0001 — Fix fragilities (RLS hardening, missing DELETE policies, helpers, indexes)
-- =============================================================================
-- Sources: brownfield-assessment.md (F4, F9), architecture-review.md (F5, F8)
-- Risk: 🟢 Low — purely additive, no data touched
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Helper function: is_user_manager
--    Used by RLS in PDI, 1:1, Feedback (visibility=shared_with_manager), Nine Box
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_user_manager(
  manager_uid uuid,
  subordinate_uid uuid,
  comp_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships
    WHERE user_id = subordinate_uid
      AND manager_id = manager_uid
      AND company_id = comp_id
      AND status = 'active'
  );
$$;

COMMENT ON FUNCTION public.is_user_manager IS
  'Returns true if manager_uid is the direct manager of subordinate_uid in comp_id';

-- -----------------------------------------------------------------------------
-- 2. Fix F4: reactions table — too permissive SELECT policy
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.reactions;
DROP POLICY IF EXISTS "Members can view reactions" ON public.reactions;

CREATE POLICY "Members can view reactions"
ON public.reactions FOR SELECT
USING (
  -- Reaction on a post
  (post_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = reactions.post_id
      AND public.is_company_member(auth.uid(), p.company_id)
  ))
  OR
  -- Reaction on a comment
  (comment_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.comments c
    JOIN public.posts p ON p.id = c.post_id
    WHERE c.id = reactions.comment_id
      AND public.is_company_member(auth.uid(), p.company_id)
  ))
);

-- -----------------------------------------------------------------------------
-- 3. Fix F9: Missing DELETE policies in survey/performance question/answer tables
-- -----------------------------------------------------------------------------

-- survey_questions
DROP POLICY IF EXISTS "Admins can delete survey questions" ON public.survey_questions;
CREATE POLICY "Admins can delete survey questions"
ON public.survey_questions FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.surveys s
  WHERE s.id = survey_questions.survey_id
    AND public.is_company_admin(auth.uid(), s.company_id)
    AND s.status = 'draft'  -- only delete from draft surveys
));

-- performance_questions
DROP POLICY IF EXISTS "Admins can delete perf questions" ON public.performance_questions;
CREATE POLICY "Admins can delete perf questions"
ON public.performance_questions FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.performance_cycles pc
  WHERE pc.id = performance_questions.cycle_id
    AND public.is_company_admin(auth.uid(), pc.company_id)
    AND pc.status IN ('draft', 'scheduled')
));

-- performance_answers
DROP POLICY IF EXISTS "Evaluator can delete own answers" ON public.performance_answers;
CREATE POLICY "Evaluator can delete own answers"
ON public.performance_answers FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.performance_evaluations pe
  WHERE pe.id = performance_answers.evaluation_id
    AND pe.evaluator_id = auth.uid()
    AND pe.status IN ('pending', 'in_progress')
));

-- -----------------------------------------------------------------------------
-- 4. Missing indexes (assessment §5 — performance hygiene)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_onboarding_feedbacks_manager
  ON public.onboarding_feedbacks(manager_id)
  WHERE manager_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_perf_evaluations_evaluator
  ON public.performance_evaluations(evaluator_id);

CREATE INDEX IF NOT EXISTS idx_perf_evaluations_evaluated
  ON public.performance_evaluations(evaluated_id);

CREATE INDEX IF NOT EXISTS idx_reactions_post
  ON public.reactions(post_id) WHERE post_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reactions_comment
  ON public.reactions(comment_id) WHERE comment_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. Sanity index for soft-delete patterns (only where missing)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_objectives_deleted_at
  ON public.objectives(deleted_at) WHERE deleted_at IS NULL;

-- =============================================================================
-- END 0001
-- =============================================================================
