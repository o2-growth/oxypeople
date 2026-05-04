import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import {
  NINE_BOX_DETAIL_KEY,
  type NineBoxPlacement,
} from "@/hooks/useNineBoxSnapshot";

interface UpdatePlacementInput {
  placementId: string;
  snapshotId: string;
  performance_axis: number;
  potential_axis: number;
  /** Se true, marca performance_source='auto_overridden' (preserva origem 'auto') */
  shouldOverride: boolean;
}

interface CreatePlacementInput {
  snapshotId: string;
  user_id: string;
  performance_axis: number;
  potential_axis: number;
}

interface DeletePlacementInput {
  placementId: string;
  snapshotId: string;
}

interface CacheShape {
  snapshot: unknown;
  placements: NineBoxPlacement[];
  pool: Array<{ id: string; full_name: string | null; avatar_url: string | null }>;
}

export function usePlacementMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  const updatePlacement = useMutation({
    mutationFn: async (input: UpdatePlacementInput) => {
      const updateData: Record<string, unknown> = {
        performance_axis: input.performance_axis,
        potential_axis: input.potential_axis,
      };
      if (input.shouldOverride) {
        updateData.performance_source = "auto_overridden";
      }
      const { error } = await supabase
        .from("nine_box_placements")
        .update(updateData)
        .eq("id", input.placementId);
      if (error) throw error;
      return input;
    },
    onMutate: async (input) => {
      const key = [NINE_BOX_DETAIL_KEY, input.snapshotId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CacheShape>(key);
      if (previous) {
        queryClient.setQueryData<CacheShape>(key, {
          ...previous,
          placements: previous.placements.map((p) =>
            p.id === input.placementId
              ? {
                  ...p,
                  performance_axis: input.performance_axis,
                  potential_axis: input.potential_axis,
                  performance_source: input.shouldOverride
                    ? "auto_overridden"
                    : p.performance_source,
                }
              : p,
          ),
        });
      }
      return { previous };
    },
    onError: (err: Error, input, ctx) => {
      const key = [NINE_BOX_DETAIL_KEY, input.snapshotId];
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
      const msg = err.message ?? "";
      if (msg.includes("violates row-level security")) {
        toast.error("Snapshot finalizado. Reabra como rascunho para editar.");
      } else {
        toast.error("Não foi possível mover o placement.");
      }
    },
    onSuccess: (input) => {
      trackEvent("nine_box_placed", {
        from_box: "?",
        to_box: `${input.performance_axis},${input.potential_axis}`,
        source_change: input.shouldOverride ? "auto_to_overridden" : "none",
      });
    },
    onSettled: (_data, _err, input) => {
      queryClient.invalidateQueries({
        queryKey: [NINE_BOX_DETAIL_KEY, input.snapshotId],
      });
    },
  });

  const createPlacement = useMutation({
    mutationFn: async (input: CreatePlacementInput) => {
      if (!userId) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from("nine_box_placements").insert({
        snapshot_id: input.snapshotId,
        user_id: input.user_id,
        performance_axis: input.performance_axis,
        potential_axis: input.potential_axis,
        performance_source: "manual",
        placed_by: userId,
      });
      if (error) throw error;
      return input;
    },
    onSuccess: (input) => {
      trackEvent("nine_box_placed", {
        from_box: "pool",
        to_box: `${input.performance_axis},${input.potential_axis}`,
      });
      toast.success("Pessoa adicionada");
      queryClient.invalidateQueries({
        queryKey: [NINE_BOX_DETAIL_KEY, input.snapshotId],
      });
    },
    onError: (err: Error) => {
      const msg = err.message ?? "";
      if (msg.includes("nine_box_placements_unique_user")) {
        toast.error("Essa pessoa já está no snapshot.");
      } else if (msg.includes("violates row-level security")) {
        toast.error("Snapshot finalizado. Reabra como rascunho para editar.");
      } else {
        toast.error("Não foi possível adicionar.");
      }
    },
  });

  const deletePlacement = useMutation({
    mutationFn: async (input: DeletePlacementInput) => {
      const { error } = await supabase
        .from("nine_box_placements")
        .delete()
        .eq("id", input.placementId);
      if (error) throw error;
      return input;
    },
    onSuccess: (input) => {
      trackEvent("nine_box_removed");
      toast.success("Pessoa removida");
      queryClient.invalidateQueries({
        queryKey: [NINE_BOX_DETAIL_KEY, input.snapshotId],
      });
    },
    onError: () => {
      toast.error("Não foi possível remover.");
    },
  });

  return { updatePlacement, createPlacement, deletePlacement };
}
