
-- 1) checkin_attachments storage SELECT: validar membership da empresa do checkin
DROP POLICY IF EXISTS "Users can read checkin attachments" ON storage.objects;
CREATE POLICY "Users can read checkin attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'checkin-attachments'
  AND EXISTS (
    SELECT 1
    FROM public.checkin_attachments ca
    JOIN public.okr_checkins c ON c.id = ca.checkin_id
    WHERE ca.file_path = storage.objects.name
      AND public.is_company_member(auth.uid(), c.company_id)
  )
);

-- 2) companies.billing_customer_id: revogar leitura da coluna sensível para autenticados
REVOKE SELECT (billing_customer_id) ON public.companies FROM authenticated, anon;
-- Admins/service_role continuam podendo ler via service role / RPC dedicado se necessário
GRANT SELECT (billing_customer_id) ON public.companies TO service_role;

-- 3) gamification_points: remover INSERT self-service (pontos só via trigger/server-side)
DROP POLICY IF EXISTS "Users can insert own points" ON public.gamification_points;

-- 4) Vazamento de objetivos privados via tabelas relacionadas
DROP POLICY IF EXISTS "Members can view company checkins" ON public.okr_checkins;
CREATE POLICY "Members can view company checkins"
ON public.okr_checkins FOR SELECT
USING (
  is_company_member(auth.uid(), company_id)
  AND EXISTS (
    SELECT 1 FROM public.key_results kr
    JOIN public.objectives o ON o.id = kr.objective_id
    WHERE kr.id = okr_checkins.key_result_id
      AND (o.visibility <> 'private'::post_visibility OR o.owner_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Members can view objective collaborators" ON public.objective_collaborators;
CREATE POLICY "Members can view objective collaborators"
ON public.objective_collaborators FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = objective_collaborators.objective_id
      AND is_company_member(auth.uid(), o.company_id)
      AND (o.visibility <> 'private'::post_visibility OR o.owner_id = auth.uid() OR objective_collaborators.user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Members can view objective relations" ON public.objective_relations;
CREATE POLICY "Members can view objective relations"
ON public.objective_relations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.objectives o
    WHERE o.id = objective_relations.parent_objective_id
      AND is_company_member(auth.uid(), o.company_id)
      AND (o.visibility <> 'private'::post_visibility OR o.owner_id = auth.uid())
  )
  AND EXISTS (
    SELECT 1 FROM public.objectives o2
    WHERE o2.id = objective_relations.child_objective_id
      AND is_company_member(auth.uid(), o2.company_id)
      AND (o2.visibility <> 'private'::post_visibility OR o2.owner_id = auth.uid())
  )
);

-- 5) post-attachments INSERT escopado pela pasta do usuário
DROP POLICY IF EXISTS "Users can upload their own attachments" ON storage.objects;
CREATE POLICY "Users can upload their own attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'post-attachments'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);
