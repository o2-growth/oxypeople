import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRealtimeObjective(objectiveId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!objectiveId) return;

    const channel = supabase
      .channel(`objective-${objectiveId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "key_results",
          filter: `objective_id=eq.${objectiveId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["objectives"] });
          queryClient.invalidateQueries({ queryKey: ["objectives-filtered"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "okr_checkins",
          filter: `objective_id=eq.${objectiveId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["checkins"] });
          queryClient.invalidateQueries({ queryKey: ["objectives"] });
          queryClient.invalidateQueries({ queryKey: ["objectives-filtered"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [objectiveId, queryClient]);
}
