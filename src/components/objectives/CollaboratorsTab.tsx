import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Users } from "lucide-react";
import { MultiPersonSelector } from "./MultiPersonSelector";
import {
  useObjectiveCollaborators,
  type CollaboratorRole,
} from "@/hooks/useObjectiveCollaborators";
import { ObjectiveWithDetails } from "@/hooks/useObjectives";

interface CollaboratorsTabProps {
  objective: ObjectiveWithDetails;
  canEdit: boolean;
}

const ROLE_LABEL: Record<CollaboratorRole, string> = {
  contributor: "Contribuidor",
  editor: "Editor",
};

const ROLE_BADGE_VARIANT: Record<CollaboratorRole, "secondary" | "default"> = {
  contributor: "secondary",
  editor: "default",
};

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email.charAt(0).toUpperCase();
}

export function CollaboratorsTab({ objective, canEdit }: CollaboratorsTabProps) {
  const {
    collaborators,
    isLoading,
    addCollaborator,
    updateCollaboratorRole,
    removeCollaborator,
  } = useObjectiveCollaborators(objective.id);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [pendingUserIds, setPendingUserIds] = useState<string[]>([]);
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null);

  const ownerId = objective.owner?.id ?? objective.owner_id;
  const excludeIds = [
    ...(ownerId ? [ownerId] : []),
    ...collaborators.map((c) => c.user_id),
  ];

  const handleConfirmAdd = async () => {
    for (const userId of pendingUserIds) {
      await addCollaborator.mutateAsync({ userId, role: "contributor" });
    }
    setPendingUserIds([]);
    setIsAddOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-base font-semibold">Colaboradores</h3>
          <Badge variant="outline" className="ml-1">
            {collaborators.length + 1}
          </Badge>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setIsAddOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {objective.owner && (
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={objective.owner.avatar_url || ""} />
                <AvatarFallback className="text-xs">
                  {getInitials(objective.owner.full_name, objective.owner.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {objective.owner.full_name || objective.owner.email}
                </span>
                <span className="text-xs text-muted-foreground">{objective.owner.email}</span>
              </div>
            </div>
            <Badge variant="default">Owner</Badge>
          </div>
        )}

        {collaborators.map((collab) => (
          <div
            key={collab.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={collab.user?.avatar_url || ""} />
                <AvatarFallback className="text-xs">
                  {getInitials(collab.user?.full_name ?? null, collab.user?.email ?? "?")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {collab.user?.full_name || collab.user?.email || "—"}
                </span>
                {collab.user?.full_name && (
                  <span className="text-xs text-muted-foreground">{collab.user.email}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canEdit ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button>
                      <Badge
                        variant={ROLE_BADGE_VARIANT[collab.role]}
                        className="cursor-pointer hover:opacity-80"
                      >
                        {ROLE_LABEL[collab.role]}
                      </Badge>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        updateCollaboratorRole.mutate({
                          collaboratorId: collab.id,
                          role: "contributor",
                        })
                      }
                    >
                      Contribuidor
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        updateCollaboratorRole.mutate({
                          collaboratorId: collab.id,
                          role: "editor",
                        })
                      }
                    >
                      Editor
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Badge variant={ROLE_BADGE_VARIANT[collab.role]}>{ROLE_LABEL[collab.role]}</Badge>
              )}

              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    setRemoveTarget({
                      id: collab.id,
                      name: collab.user?.full_name || collab.user?.email || "este colaborador",
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {collaborators.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Nenhum colaborador além do owner.
          </div>
        )}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar colaboradores</DialogTitle>
            <DialogDescription>
              Selecione pessoas para adicionar como contribuidores. Você pode mudar o papel depois.
            </DialogDescription>
          </DialogHeader>
          <MultiPersonSelector
            value={pendingUserIds}
            onValueChange={setPendingUserIds}
            placeholder="Buscar pessoa..."
            excludeIds={excludeIds}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAdd}
              disabled={pendingUserIds.length === 0 || addCollaborator.isPending}
            >
              {addCollaborator.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar {pendingUserIds.length > 0 && `(${pendingUserIds.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover colaborador?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.name} perderá acesso de colaboração a este objetivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removeTarget) {
                  removeCollaborator.mutate(removeTarget.id);
                  setRemoveTarget(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
