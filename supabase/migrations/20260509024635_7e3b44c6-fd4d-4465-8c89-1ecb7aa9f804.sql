
-- Reactions: restrict SELECT to company members
DROP POLICY IF EXISTS "Anyone can view reactions" ON public.reactions;
CREATE POLICY "Members can view reactions"
ON public.reactions FOR SELECT
TO authenticated
USING (
  (post_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = reactions.post_id
      AND public.is_company_member(auth.uid(), p.company_id)
  ))
  OR
  (comment_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.comments c
    JOIN public.posts p ON p.id = c.post_id
    WHERE c.id = reactions.comment_id
      AND public.is_company_member(auth.uid(), p.company_id)
  ))
);

-- Onboarding feedbacks: require company membership for forwarded managers
DROP POLICY IF EXISTS "Managers can view forwarded feedbacks" ON public.onboarding_feedbacks;
CREATE POLICY "Managers can view forwarded feedbacks"
ON public.onboarding_feedbacks FOR SELECT
TO authenticated
USING (
  (auth.uid() = ANY (forwarded_to))
  AND public.is_company_member(auth.uid(), company_id)
);

-- Performance evaluations: tighten UPDATE + add admin DELETE
DROP POLICY IF EXISTS "Users can update own evaluations" ON public.performance_evaluations;
CREATE POLICY "Users can update own evaluations"
ON public.performance_evaluations FOR UPDATE
TO authenticated
USING (
  evaluator_id = auth.uid()
  AND status = 'pending'
  AND (due_date IS NULL OR due_date >= CURRENT_DATE)
)
WITH CHECK (
  evaluator_id = auth.uid()
  AND status IN ('pending','in_progress','completed')
);

DROP POLICY IF EXISTS "Admins can delete evaluations" ON public.performance_evaluations;
CREATE POLICY "Admins can delete evaluations"
ON public.performance_evaluations FOR DELETE
TO authenticated
USING (public.is_company_admin(auth.uid(), company_id));
