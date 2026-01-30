import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles } from "lucide-react";

const mockUsers = [
  { id: "1", name: "Ana Silva", avatar: "", initials: "AS" },
  { id: "2", name: "Carlos Santos", avatar: "", initials: "CS" },
  { id: "3", name: "Maria Oliveira", avatar: "", initials: "MO" },
  { id: "4", name: "João Pereira", avatar: "", initials: "JP" },
];

const badges = [
  { id: "1", name: "Colaboração", icon: "🤝", points: 10, color: "#10b981" },
  { id: "2", name: "Inovação", icon: "💡", points: 15, color: "#f59e0b" },
  { id: "3", name: "Liderança", icon: "🌟", points: 20, color: "#8b5cf6" },
  { id: "4", name: "Excelência", icon: "🏆", points: 25, color: "#ef4444" },
  { id: "5", name: "Mentoria", icon: "🎓", points: 15, color: "#3b82f6" },
];

export function SendRecognition() {
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedBadge, setSelectedBadge] = useState("");
  const [message, setMessage] = useState("");

  const selectedBadgeData = badges.find(b => b.id === selectedBadge);

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Enviar Reconhecimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Para quem?</label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um colega" />
              </SelectTrigger>
              <SelectContent>
                {mockUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-xs">{user.initials}</AvatarFallback>
                      </Avatar>
                      {user.name}
                    </div>
                  </SelectItem>
                ))}
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
                {badges.map(badge => (
                  <SelectItem key={badge.id} value={badge.id}>
                    <div className="flex items-center gap-2">
                      <span>{badge.icon}</span>
                      {badge.name}
                      <span className="text-xs text-muted-foreground">+{badge.points}pts</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedBadgeData && (
          <div className="flex items-center gap-2">
            <Badge 
              style={{ backgroundColor: `${selectedBadgeData.color}20`, color: selectedBadgeData.color }}
              className="gap-1.5"
            >
              {selectedBadgeData.icon} {selectedBadgeData.name}
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
          disabled={!selectedUser || !selectedBadge || !message.trim()}
        >
          <Send className="h-4 w-4" />
          Enviar Reconhecimento
        </Button>
      </CardContent>
    </Card>
  );
}
