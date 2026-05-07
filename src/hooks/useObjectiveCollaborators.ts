import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toastDbError } from "@/lib/db-errors";
import { trackEvent } from "@/lib/analytics";

export type CollaboratorRole = "contributor" | "editor";

export interface ObjectiveCollaborator {
  id: string;
  user_id: string;
  role: CollaboratorRole;
  user: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
}

export function useObjectiveCollaborators(objectiveId: string | undefined) {
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ["objective-collaborators", objectiveId],
    queryFn: async (): Promise<ObjectiveCollaborator[]> => {
      if (!objectiveId) return [];

      const { data, error } = await supabase
        .from("objective_collaborators")
        .select(`
          id,
          user_id,
          role,
          user:user_id(id, full_name, email, avatar_url)
        `)
        .eq("objective_id", objectiveId);

      if (error) throw error;

      return (data || []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        role: row.role as CollaboratorRole,
        user: row.user as ObjectiveCollaborator["user"],
      }));
    },
    enabled: !!objectiveId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["objective-collaborators", objectiveId] });
    queryClient.invalidateQueries({ queryKey: ["objectives"] });
  };

  const addCollaborator = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: CollaboratorRole }) => {
      if (!objectiveId) throw new Error("Missing objectiveId");
      const { error } = await supabase
        .from("objective_collaborators")
        .insert({ objective_id: objectiveId, user_id: userId, role });
      if (error) throw error;
      return { userId, role };
    },
    onSuccess: ({ role }) => {
      invalidate();
      toast.success("Colaborador adicionado");
      trackEvent("objective_collaborator_added", { objective_id: objectiveId, role });
    },
    onError: (err) => toastDbError(err, "Erro ao adicionar"),
  });

  const updateCollaboratorRole = useMutation({
    mutationFn: async ({ collaboratorId, role }: { collaboratorId: string; role: CollaboratorRole }) => {
      const { error } = await supabase
        .from("objective_collaborators")
        .update({ role })
        .eq("id", collaboratorId);
      if (error) throw error;
      return { collaboratorId, role };
    },
    onSuccess: ({ role }) => {
      invalidate();
      toast.success(`Papel atualizado para ${role === "editor" ? "Editor" : "Contribuidor"}`);
      trackEvent("objective_collaborator_role_changed", { objective_id: objectiveId, role });
    },
    onError: (err) => toastDbError(err, "Erro ao atualizar"),
  });

  const removeCollaborator = useMutation({
    mutationFn: async (collaboratorId: string) => {
      const { error } = await supabase
        .from("objective_collaborators")
        .delete()
        .eq("id", collaboratorId);
      if (error) throw error;
      return collaboratorId;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Colaborador removido");
      trackEvent("objective_collaborator_removed", { objective_id: objectiveId });
    },
    onError: (err) => toastDbError(err, "Erro ao remover"),
  });

  return {
    collaborators: list.data ?? [],
    isLoading: list.isLoading,
    addCollaborator,
    updateCollaboratorRole,
    removeCollaborator,
  };
}
