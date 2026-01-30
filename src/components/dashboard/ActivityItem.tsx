import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActivityItemProps {
  user: {
    name: string;
    avatar?: string;
  };
  action: string;
  target?: string;
  timestamp: Date;
  type?: "recognition" | "objective" | "post" | "survey";
}

export function ActivityItem({
  user,
  action,
  target,
  timestamp,
  type = "post",
}: ActivityItemProps) {
  const getTypeStyles = () => {
    switch (type) {
      case "recognition":
        return "badge-success";
      case "objective":
        return "badge-accent";
      case "survey":
        return "badge-warning";
      default:
        return "";
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case "recognition":
        return "Reconhecimento";
      case "objective":
        return "Objetivo";
      case "survey":
        return "Pesquisa";
      default:
        return "Post";
    }
  };

  return (
    <div className="list-item-interactive">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-semibold text-foreground">{user.name}</span>{" "}
          <span className="text-muted-foreground">{action}</span>
          {target && (
            <span className="font-medium text-foreground"> {target}</span>
          )}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="outline" className={getTypeStyles()}>
            {getTypeLabel()}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(timestamp, { addSuffix: true, locale: ptBR })}
          </span>
        </div>
      </div>
    </div>
  );
}
