import { AppLayout } from "@/components/layout/AppLayout";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { OkrSettingsPanel } from "@/components/objectives/OkrSettingsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Link2,
  Moon,
  Sun,
  LogOut,
  Trash2,
  Target,
} from "lucide-react";

export default function Settings() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas preferências e configurações de conta
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="flex-wrap h-auto gap-2">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="h-4 w-4" />
              Privacidade
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              Aparência
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Link2 className="h-4 w-4" />
              Integrações
            </TabsTrigger>
            <TabsTrigger value="okr" className="gap-2">
              <Target className="h-4 w-4" />
              OKR
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-6">
            <ProfileForm
              user={{
                name: "Usuário",
                email: "usuario@empresa.com",
                avatar: "",
                initials: "U",
                bio: "",
                phone: "",
                department: "",
                position: "",
              }}
            />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-6">
            <NotificationSettings />
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visibilidade do Perfil</CardTitle>
                <CardDescription>
                  Controle quem pode ver suas informações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mostrar email no perfil</Label>
                    <p className="text-sm text-muted-foreground">
                      Outros membros podem ver seu email
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mostrar telefone no perfil</Label>
                    <p className="text-sm text-muted-foreground">
                      Outros membros podem ver seu telefone
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mostrar no ranking</Label>
                    <p className="text-sm text-muted-foreground">
                      Aparecer no leaderboard de reconhecimentos
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atividade</CardTitle>
                <CardDescription>
                  Controle a visibilidade da sua atividade
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mostrar status online</Label>
                    <p className="text-sm text-muted-foreground">
                      Outros podem ver quando você está online
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Mostrar última atividade</Label>
                    <p className="text-sm text-muted-foreground">
                      Exibir quando você esteve ativo pela última vez
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Tema</CardTitle>
                <CardDescription>
                  Personalize a aparência do aplicativo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <button className="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-primary bg-primary/5 transition-all">
                    <div className="h-12 w-12 rounded-lg bg-background border flex items-center justify-center">
                      <Sun className="h-6 w-6" />
                    </div>
                    <span className="font-medium text-foreground">Claro</span>
                  </button>
                  <button className="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-muted hover:border-primary/50 transition-all">
                    <div className="h-12 w-12 rounded-lg bg-slate-800 flex items-center justify-center">
                      <Moon className="h-6 w-6 text-white" />
                    </div>
                    <span className="font-medium text-foreground">Escuro</span>
                  </button>
                  <button className="flex flex-col items-center gap-3 p-4 rounded-lg border-2 border-muted hover:border-primary/50 transition-all">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-background to-slate-800 flex items-center justify-center">
                      <div className="flex">
                        <Sun className="h-4 w-4" />
                        <Moon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <span className="font-medium text-foreground">Sistema</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Integrações Conectadas</CardTitle>
                <CardDescription>
                  Gerencie suas conexões com outros serviços
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-[#4A154B] flex items-center justify-center text-white font-bold">
                      S
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Slack</p>
                      <p className="text-sm text-muted-foreground">Não conectado</p>
                    </div>
                  </div>
                  <Button variant="outline">Conectar</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-[#0078D4] flex items-center justify-center text-white font-bold">
                      T
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Microsoft Teams</p>
                      <p className="text-sm text-muted-foreground">Não conectado</p>
                    </div>
                  </div>
                  <Button variant="outline">Conectar</Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-[#4285F4] flex items-center justify-center text-white font-bold">
                      G
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Google Calendar</p>
                      <p className="text-sm text-green-500">Conectado</p>
                    </div>
                  </div>
                  <Button variant="destructive" size="sm">Desconectar</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* OKR Settings Tab */}
          <TabsContent value="okr" className="mt-6">
            <OkrSettingsPanel />
          </TabsContent>
        </Tabs>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            <CardDescription>
              Ações irreversíveis para sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Sair da conta</p>
                <p className="text-sm text-muted-foreground">
                  Desconectar de todos os dispositivos
                </p>
              </div>
              <Button variant="outline" className="gap-2">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="font-medium text-destructive">Excluir conta</p>
                <p className="text-sm text-muted-foreground">
                  Remover permanentemente sua conta e dados
                </p>
              </div>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
