import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageSquare, Trophy, Target, BarChart3 } from "lucide-react";

const notificationGroups = [
  {
    title: "Comunicação",
    icon: MessageSquare,
    notifications: [
      { id: "post_mentions", label: "Menções em posts", description: "Quando alguém mencionar você em um post", enabled: true },
      { id: "comments", label: "Comentários", description: "Novos comentários em seus posts", enabled: true },
      { id: "direct_messages", label: "Mensagens diretas", description: "Novas mensagens privadas", enabled: true },
    ],
  },
  {
    title: "Reconhecimentos",
    icon: Trophy,
    notifications: [
      { id: "recognition_received", label: "Reconhecimentos recebidos", description: "Quando receber um reconhecimento", enabled: true },
      { id: "recognition_reactions", label: "Reações", description: "Quando alguém reagir a um reconhecimento", enabled: false },
    ],
  },
  {
    title: "Objetivos",
    icon: Target,
    notifications: [
      { id: "objective_updates", label: "Atualizações de OKRs", description: "Mudanças em objetivos que você acompanha", enabled: true },
      { id: "objective_deadlines", label: "Prazos", description: "Lembretes de prazos próximos", enabled: true },
    ],
  },
  {
    title: "Pesquisas",
    icon: BarChart3,
    notifications: [
      { id: "new_surveys", label: "Novas pesquisas", description: "Quando uma nova pesquisa estiver disponível", enabled: true },
      { id: "survey_reminders", label: "Lembretes", description: "Lembretes para pesquisas pendentes", enabled: true },
    ],
  },
];

export function NotificationSettings() {
  return (
    <div className="space-y-6">
      {/* Email Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Preferências de Email
          </CardTitle>
          <CardDescription>
            Configure como você recebe emails do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Resumo diário</Label>
              <p className="text-sm text-muted-foreground">
                Receba um resumo diário das atividades
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Resumo semanal</Label>
              <p className="text-sm text-muted-foreground">
                Receba um resumo semanal com highlights
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Emails de marketing</Label>
              <p className="text-sm text-muted-foreground">
                Novidades e atualizações do produto
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Configure as notificações que você recebe no navegador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {notificationGroups.map((group) => (
            <div key={group.title} className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <group.icon className="h-4 w-4 text-muted-foreground" />
                {group.title}
              </div>
              <div className="space-y-3 ml-6">
                {group.notifications.map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-normal">{notification.label}</Label>
                      <p className="text-xs text-muted-foreground">
                        {notification.description}
                      </p>
                    </div>
                    <Switch defaultChecked={notification.enabled} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
