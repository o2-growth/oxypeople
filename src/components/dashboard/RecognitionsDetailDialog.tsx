import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRecognitionsDetails } from "@/hooks/useDashboardDetails";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecognitionsDetailDialog({ open, onOpenChange }: Props) {
  const { data, isLoading } = useRecognitionsDetails(open);
  const navigate = useNavigate();

  const change = data && data.lastMonth > 0
    ? Math.round(((data.thisMonth - data.lastMonth) / data.lastMonth) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Reconhecimentos
          </DialogTitle>
          <DialogDescription>Detalhes dos reconhecimentos do mês</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-2">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-secondary/50 p-3 text-center">
                  <p className="text-2xl font-bold">{data.thisMonth}</p>
                  <p className="text-xs text-muted-foreground">Este mês</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {change > 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> :
                     change < 0 ? <TrendingDown className="h-4 w-4 text-destructive" /> :
                     <Minus className="h-4 w-4 text-muted-foreground" />}
                    <p className="text-2xl font-bold">{change > 0 ? "+" : ""}{change}%</p>
                  </div>
                  <p className="text-xs text-muted-foreground">vs mês anterior</p>
                </div>
              </div>

              {/* Top recognized */}
              {data.topRecognized.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">🏆 Mais Reconhecidos</h4>
                  <div className="space-y-2">
                    {data.topRecognized.map((item, i) => (
                      <div key={item.user.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/30 transition-colors">
                        <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={item.user.avatar_url || ""} />
                          <AvatarFallback className="text-xs">
                            {(item.user.full_name || "?").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm flex-1 truncate">{item.user.full_name}</span>
                        <span className="text-sm font-bold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top badges */}
              {data.topBadges.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">🏅 Badges Mais Usados</h4>
                  <div className="space-y-2">
                    {data.topBadges.map(item => (
                      <div key={item.badge.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/30 transition-colors">
                        <span className="text-lg">{item.badge.emoji || "🎖️"}</span>
                        <span className="text-sm flex-1 truncate">{item.badge.name}</span>
                        <span className="text-sm font-bold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent */}
              {data.recent.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Recentes</h4>
                  <div className="space-y-2">
                    {data.recent.map(r => (
                      <div key={r.id} className="rounded-lg bg-secondary/30 p-3 text-sm">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="font-medium">{(r.from_user as any)?.full_name}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium">{(r.to_user as any)?.full_name}</span>
                          {(r.badge as any)?.emoji && (
                            <span className="ml-1">{(r.badge as any).emoji}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </ScrollArea>

        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={() => {
            onOpenChange(false);
            navigate("/recognition");
          }}
        >
          Ver todos
        </Button>
      </DialogContent>
    </Dialog>
  );
}
