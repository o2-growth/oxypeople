import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, MessageSquare, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEngagementDetails } from "@/hooks/useDashboardDetails";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EngagementDetailDialog({ open, onOpenChange }: Props) {
  const { data, isLoading } = useEngagementDetails(open);
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Engajamento
          </DialogTitle>
          <DialogDescription>Atividade e engajamento do mês</DialogDescription>
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
                  <div className="flex items-center justify-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <p className="text-2xl font-bold">{data.postsThisMonth}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Posts este mês</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <p className="text-2xl font-bold">{data.recognitionsThisMonth}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Reconhecimentos</p>
                </div>
              </div>

              {/* Weekly chart */}
              {data.weeks.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Atividade Semanal</h4>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.weeks}>
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="posts" name="Posts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="recognitions" name="Reconhecimentos" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Top engaged */}
              {data.topUsers.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">🔥 Mais Engajados</h4>
                  <div className="space-y-2">
                    {data.topUsers.map((user: any, i: number) => (
                      <div key={user.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/30 transition-colors">
                        <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || ""} />
                          <AvatarFallback className="text-xs">
                            {(user.full_name || "?").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.posts}p · {user.recognitions}r
                          </p>
                        </div>
                        <span className="text-sm font-bold">{user.total}</span>
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
            navigate("/feed");
          }}
        >
          Ver detalhes
        </Button>
      </DialogContent>
    </Dialog>
  );
}
