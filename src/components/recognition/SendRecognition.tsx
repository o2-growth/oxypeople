import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useBadges } from "@/hooks/useBadges";
import { useRecognitions } from "@/hooks/useRecognitions";
import { Skeleton } from "@/components/ui/skeleton";

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function SendRecognition() {
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedBadge, setSelectedBadge] = useState("");
  const [message, setMessage] = useState("");

  const { data: users, isLoading: isLoadingUsers } = useCompanyUsers();
  const { data: badges, isLoading: isLoadingBadges } = useBadges();
  const { sendRecognition } = useRecognitions();

  const selectedBadgeData = badges?.find((b) => b.id === selectedBadge);

  const handleSend = () => {
    if (!selectedUser || !selectedBadge || !message.trim() || !selectedBadgeData) return;

    sendRecognition.mutate(
      {
        toUserId: selectedUser,
        badgeId: selectedBadge,
        message: message.trim(),
        points: selectedBadgeData.points,
      },
      {
        onSuccess: () => {
          setSelectedUser("");
          setSelectedBadge("");
          setMessage("");
        },
      }
    );
  };

  const isLoading = isLoadingUsers || isLoadingBadges;

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Enviar Reconhecimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
            <Skeleton className="h-24" />
            <Skeleton className="h-10" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Para quem?</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um colega" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar_url || ""} />
                            <AvatarFallback className="text-xs">
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          {user.full_name || "Sem nome"}
                        </div>
                      </SelectItem>
                    ))}
                    {(!users || users.length === 0) && (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        Nenhum colega encontrado
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Badge</label>
                <Select value={selectedBadge} onValueChange={setSelectedBadge}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um badge" />
                  </SelectTrigger>
                  <SelectContent>
                    {badges?.map((badge) => (
                      <SelectItem key={badge.id} value={badge.id}>
                        <div className="flex items-center gap-2">
                          <span>{badge.emoji || "🏅"}</span>
                          {badge.name}
                          <span className="text-xs text-muted-foreground">+{badge.points}pts</span>
                        </div>
                      </SelectItem>
                    ))}
                    {(!badges || badges.length === 0) && (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        Nenhum badge configurado
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedBadgeData && (
              <div className="flex items-center gap-2">
                <Badge
                  style={{
                    backgroundColor: `${selectedBadgeData.color || "#10b981"}20`,
                    color: selectedBadgeData.color || "#10b981",
                  }}
                  className="gap-1.5"
                >
                  {selectedBadgeData.emoji || "🏅"} {selectedBadgeData.name}
                </Badge>
                <span className="text-sm text-muted-foreground">+{selectedBadgeData.points} pontos</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Mensagem</label>
              <Textarea
                placeholder="Escreva sua mensagem de reconhecimento..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>

            <Button
              className="w-full gap-2"
              disabled={!selectedUser || !selectedBadge || !message.trim() || sendRecognition.isPending}
              onClick={handleSend}
            >
              {sendRecognition.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar Reconhecimento
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
