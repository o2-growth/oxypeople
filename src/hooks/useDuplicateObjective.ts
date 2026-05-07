import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "./useUser";
import { ObjectiveWithDetails } from "./useObjectives";
import { toast } from "sonner";
import { toastDbError } from "@/lib/db-errors";

export function useDuplicateObjective() {
  const { user } = useAuth();
  const { profile } = useUser();
  const queryClient = useQueryClient();
  const companyId = profile?.primary_company_id;

  return useMutation({
    mutationFn: async (objective: ObjectiveWithDetails) => {
      if (!user?.id || !companyId) throw new Error("Not authenticated");

      // Duplicate the objective
      const { data: newObj, error: objError } = await supabase
        .from("objectives")
        .insert({
          company_id: companyId,
          owner_id: user.id,
          created_by: user.id,
          title: `${objective.title} (cópia)`,
          description: objective.description,
          due_date: objective.due_date,
          visibility: objective.visibility,
          type: objective.type,
          team_id: objective.team_id,
          assignee_id: objective.assignee_id,
          parent_id: objective.parent_id,
          period_id: objective.period_id,
          department: objective.department,
          owner_department_id: objective.owner_department_id,
          tags: objective.tags,
          status: "planned",
          progress: 0,
          is_active: true,
        })
        .select()
        .single();

      if (objError) throw objError;

      // Duplicate KRs (without checkins)
      if (objective.key_results.length > 0) {
        const krsData = objective.key_results
          .filter((kr) => !kr.deleted_at)
          .map((kr) => ({
            objective_id: newObj.id,
            title: kr.title,
            target_value: kr.target_value,
            current_value: 0,
            initial_value: kr.initial_value,
            unit: kr.unit,
            kr_type: kr.kr_type,
            weight_percentage: kr.weight_percentage,
            owner_user_id: kr.owner_user_id,
            direction: kr.direction,
          }));

        if (krsData.length > 0) {
          const { error: krError } = await supabase
            .from("key_results")
            .insert(krsData);

          if (krError) throw krError;
        }
      }

      // Create relation if has parent
      if (objective.parent_id) {
        await supabase.from("objective_relations").insert({
          parent_objective_id: objective.parent_id,
          child_objective_id: newObj.id,
          weight_percentage: 0,
        });
      }

      return newObj;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
      queryClient.invalidateQueries({ queryKey: ["objectives-filtered"] });
      toast.success("Objetivo duplicado com sucesso!");
    },
    onError: (err) => {
      toastDbError(err, "Erro ao duplicar objetivo");
    },
  });
}
