
-- Drop the existing ALL policy and replace with broader permissions
DROP POLICY "Objective owners can manage key results" ON public.key_results;

CREATE POLICY "Authorized users can insert key results"
ON public.key_results
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM objectives o
    WHERE o.id = key_results.objective_id
    AND (
      o.owner_id = auth.uid()
      OR o.assignee_id = auth.uid()
      OR o.created_by = auth.uid()
      OR is_company_admin(auth.uid(), o.company_id)
      OR (o.team_id IS NOT NULL AND is_team_leader(auth.uid(), o.team_id))
    )
  )
);

CREATE POLICY "Authorized users can update key results"
ON public.key_results
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM objectives o
    WHERE o.id = key_results.objective_id
    AND (
      o.owner_id = auth.uid()
      OR o.assignee_id = auth.uid()
      OR o.created_by = auth.uid()
      OR is_company_admin(auth.uid(), o.company_id)
      OR (o.team_id IS NOT NULL AND is_team_leader(auth.uid(), o.team_id))
    )
  )
);

CREATE POLICY "Authorized users can delete key results"
ON public.key_results
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM objectives o
    WHERE o.id = key_results.objective_id
    AND (
      o.owner_id = auth.uid()
      OR o.created_by = auth.uid()
      OR is_company_admin(auth.uid(), o.company_id)
    )
  )
);
