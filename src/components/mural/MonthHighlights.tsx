import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTopRecognized } from "@/hooks/useTopRecognized";
import { useNavigate } from "react-router-dom";

export function MonthHighlights() {
  const { data: topRecognized, isLoading: loadingTop } = useTopRecognized(3);
  const navigate = useNavigate();

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Award className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-semibold">Destaque do Mês</h3>
        </div>
        {loadingTop ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : topRecognized && topRecognized.length > 0 ? (
          <div className="space-y-2.5">
            {topRecognized.map((user, index) => (
              <div key={user.user_id} className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-warning to-orange-500 text-white text-[10px] font-bold shrink-0">
                  {index + 1}
                </span>
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{user.full_name || "Usuário"}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.recognitions_count} reconhecimento{user.recognitions_count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhum reconhecimento este mês</p>
        )}
        <Button variant="ghost" size="sm" className="w-full mt-3 text-xs" onClick={() => navigate("/recognition")}>
          Ver todos →
        </Button>
      </CardContent>
    </Card>
  );
}
