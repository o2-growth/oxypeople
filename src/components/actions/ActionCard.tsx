import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Target, GripVertical } from "lucide-react";
import { Action, useUpdateAction, useDeleteAction } from "@/hooks/useActions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ActionCardProps {
  action: Action;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  todo: { label: "A fazer", color: "bg-muted text-muted-foreground" },
  doing: { label: "Fazendo", color: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  done: { label: "Feito", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
  blocked: { label: "Bloqueado", color: "bg-red-500/10 text-red-500 border-red-500/30" },
};

export function ActionCard({ action }: ActionCardProps) {
  const updateAction = useUpdateAction();
  const deleteAction = useDeleteAction();
  const status = statusConfig[action.status] || statusConfig.todo;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: action.id,
    data: { type: "action", action },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    return email.charAt(0).toUpperCase();
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateAction.mutateAsync({ id: action.id, status: newStatus as any });
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAction.mutateAsync(action.id);
      toast.success("Ação excluída");
    } catch {
      toast.error("Erro ao excluir ação");
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow",
        isDragging && "shadow-lg ring-2 ring-primary/20"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="shrink-0 cursor-grab active:cursor-grabbing mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <h4 className="text-xs font-medium text-foreground leading-snug flex-1">
          {action.title}
        </h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => handleStatusChange(key)}
                disabled={key === action.status}
              >
                <Badge variant="outline" className={cn("text-[9px] mr-2", cfg.color)}>
                  {cfg.label}
                </Badge>
                Mover para {cfg.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {action.description && (
        <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
          {action.description}
        </p>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          {action.owner && (
            <Avatar className="h-5 w-5">
              <AvatarImage src={action.owner.avatar_url || ""} />
              <AvatarFallback className="text-[8px]">
                {getInitials(action.owner.full_name, action.owner.email)}
              </AvatarFallback>
            </Avatar>
          )}
          <Badge variant="outline" className={cn("text-[9px] h-4 px-1", status.color)}>
            {status.label}
          </Badge>
        </div>

        {action.objective && (
          <div className="flex items-center gap-1 max-w-[100px]">
            <Target className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-[9px] text-muted-foreground truncate">
              {action.objective.title}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
