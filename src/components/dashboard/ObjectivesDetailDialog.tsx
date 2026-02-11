import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, CheckCircle2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useObjectivesDetails } from "@/hooks/useDashboardDetails";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig = {
  completed: { label: "Concluídos", color: "bg-emerald-500" },
  on_track: { label: "No prazo", color: "bg-blue-500" },
  attention: { label: "Atenção", color: "bg-amber-500" },
  risk: { label: "Em risco", color: "bg-destructive" },
};

export function ObjectivesDetailDialog({ open, onOpenChange }: Props) {
  const { data, isLoading } = useObjectivesDetails(open);
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            Objetivos
          </DialogTitle>
          <DialogDescription>Distribuição e progresso dos objetivos</DialogDescription>
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
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-secondary/50 p-3 text-center">
                  <p className="text-2xl font-bold">{data.total}</p>
                  <p className="text-xs text-muted-foreground">Ativos</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 text-center">
                  <p className="text-2xl font-bold">{data.completed}</p>
                  <p className="text-xs text-muted-foreground">Concluídos</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 text-center">
                  <p className="text-2xl font-bold">{data.completionRate}%</p>
                  <p className="text-xs text-muted-foreground">Taxa</p>
                </div>
              </div>

              {/* Status distribution */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Distribuição por Status</h4>
                <div className="space-y-2.5">
                  {([
                    { key: "completed", value: data.completed },
                    { key: "on_track", value: data.onTrack },
                    { key: "attention", value: data.attention },
                    { key: "risk", value: data.risk },
                  ] as const).map(item => {
                    const config = statusConfig[item.key as keyof typeof statusConfig];
                    const pct = data.total > 0 ? (item.value / data.total) * 100 : 0;
                    return (
                      <div key={item.key} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${config.color}`} />
                            <span className="text-muted-foreground">{config.label}</span>
                          </div>
                          <span className="font-medium">{item.value}</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent completed */}
              {data.recentCompleted.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Concluídos Recentemente
                  </h4>
                  <div className="space-y-2">
                    {data.recentCompleted.map(obj => (
                      <div key={obj.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/30 transition-colors">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={(obj.owner as any)?.avatar_url || ""} />
                          <AvatarFallback className="text-xs">
                            {((obj.owner as any)?.full_name || "?").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm flex-1 truncate">{obj.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* At risk */}
              {data.atRisk.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Em Risco
                  </h4>
                  <div className="space-y-2">
                    {data.atRisk.map(obj => (
                      <div key={obj.id} className="flex items-center gap-3 rounded-lg p-2 bg-destructive/5 border border-destructive/10">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={(obj.owner as any)?.avatar_url || ""} />
                          <AvatarFallback className="text-xs">
                            {((obj.owner as any)?.full_name || "?").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{obj.title}</p>
                          <p className="text-xs text-muted-foreground">{obj.progress}% concluído</p>
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
            navigate("/objectives");
          }}
        >
          Ver todos
        </Button>
      </DialogContent>
    </Dialog>
  );
}
