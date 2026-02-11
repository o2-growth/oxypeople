import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";
import { useTopRecognized } from "@/hooks/useTopRecognized";

export function TopRecognizedWidget() {
  const { data: topUsers, isLoading } = useTopRecognized(3);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Trophy className="h-4 w-4 text-warning" />
        Top Reconhecidos
      </h3>
      {isLoading ? (
        <div className="text-xs text-muted-foreground">Carregando...</div>
      ) : topUsers && topUsers.length > 0 ? (
        <div className="space-y-2">
          {topUsers.map((user, i) => {
            const initials = user.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "?";
            const medals = ["🥇", "🥈", "🥉"];
            return (
              <div key={user.user_id} className="flex items-center gap-3">
                <span className="text-sm w-5 text-center">{medals[i] || ""}</span>
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{user.full_name || "Sem nome"}</p>
                </div>
                <span className="text-xs font-bold text-primary">{user.recognitions_count}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Nenhum reconhecimento este mês</p>
      )}
    </div>
  );
}
