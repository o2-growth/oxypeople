import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PoolUser } from "@/hooks/useNineBoxSnapshot";

interface NineBoxPoolProps {
  users: PoolUser[];
  disabled: boolean;
}

function initialsOf(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function NineBoxPool({ users, disabled }: NineBoxPoolProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "pool-drop", disabled });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "h-full transition-colors",
        isOver && !disabled && "ring-2 ring-destructive",
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4" />
          Pool ({users.length})
          {isOver && !disabled && (
            <span className="text-xs text-destructive">Solte aqui para remover</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[600px] overflow-y-auto space-y-1">
        {users.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Todos os colaboradores já estão na matriz.
          </p>
        ) : (
          users.map((u) => (
            <PoolItem key={u.id} user={u} disabled={disabled} />
          ))
        )}
        <Badge variant="outline" className="mt-2 w-full justify-center font-normal">
          Arraste para a matriz
        </Badge>
      </CardContent>
    </Card>
  );
}

interface PoolItemProps {
  user: PoolUser;
  disabled: boolean;
}

function PoolItem({ user, disabled }: PoolItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `pool-${user.id}`,
    disabled,
    data: { fromPool: true, userId: user.id },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
      }}
      className={cn(
        "flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-xs",
        !disabled && "cursor-grab active:cursor-grabbing hover:border-primary",
        disabled && "opacity-60",
      )}
    >
      <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground" />
      <Avatar className="h-5 w-5">
        <AvatarImage src={user.avatar_url ?? undefined} />
        <AvatarFallback className="text-[9px]">
          {initialsOf(user.full_name)}
        </AvatarFallback>
      </Avatar>
      <span className="truncate flex-1">{user.full_name || "Sem nome"}</span>
    </div>
  );
}
