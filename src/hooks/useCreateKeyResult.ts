import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CreateKeyResultInput {
  objective_id: string;
  title: string;
  target_value: number;
  initial_value?: number;
  current_value?: number;
  unit?: string;
  kr_type?: string;
  weight_percentage?: number;
  owner_user_id?: string;
  direction?: string;
}

export function useCreateKeyResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateKeyResultInput) => {
      const { data, error } = await supabase
        .from("key_results")
        .insert({
          objective_id: input.objective_id,
          title: input.title,
          target_value: input.target_value,
          initial_value: input.initial_value || 0,
          current_value: input.current_value || 0,
          unit: input.unit || "%",
          kr_type: input.kr_type || "numeric",
          weight_percentage: input.weight_percentage || 0,
          owner_user_id: input.owner_user_id || null,
          direction: input.direction || "up",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
      queryClient.invalidateQueries({ queryKey: ["objectives-filtered"] });
    },
  });
}
