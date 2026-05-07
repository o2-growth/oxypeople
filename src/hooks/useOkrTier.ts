import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOkrAccessLevels, type OkrAccessLevel } from "@/hooks/useOkrAccessLevels";
import { useUserPermissions } from "@/hooks/useUserPermissions";

export type OkrTier = OkrAccessLevel | "unknown";

export function useOkrTier() {
  const { user } = useAuth();
  const { byUserId, isLoading: levelsLoading } = useOkrAccessLevels();
  const { isAdmin, isLoading: permsLoading } = useUserPermissions();

  const tier: OkrTier = useMemo(() => {
    if (!user?.id) return "unknown";
    const row = byUserId.get(user.id);
    return row?.okr_access_level ?? "unknown";
  }, [byUserId, user?.id]);

  const isLoading = levelsLoading || permsLoading;
  const canCreateObjective = tier === "manager" || isAdmin;
  const canManageRelations = tier === "manager" || isAdmin;
  const canCheckin = tier === "manager" || tier === "contributor" || isAdmin;

  const canManageCollaborators = (
    objectiveOwnerId: string | null | undefined,
    objectiveCreatedById: string | null | undefined,
  ): boolean => {
    if (isAdmin || tier === "manager") return true;
    if (!user?.id) return false;
    return user.id === objectiveOwnerId || user.id === objectiveCreatedById;
  };

  const canCreateKR = (objectiveType: string): boolean => {
    if (objectiveType !== "operational") return false;
    return tier === "manager" || tier === "contributor" || isAdmin;
  };

  return {
    tier,
    isLoading,
    isAdmin,
    canCreateObjective,
    canManageRelations,
    canManageCollaborators,
    canCreateKR,
    canCheckin,
  };
}
