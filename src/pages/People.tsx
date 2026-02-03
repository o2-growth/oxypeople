import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, UserPlus, MoreHorizontal, Users, ClipboardList, BarChart3 } from "lucide-react";
import { InviteModal } from "@/components/company/InviteModal";
import { FeedbackTab } from "@/components/people/FeedbackTab";
import { NPSTab } from "@/components/people/NPSTab";
import { useUserPermissions } from "@/hooks/useUserPermissions";

const people = [
  {
    id: 1,
    name: "Ana Silva",
    email: "ana.silva@empresa.com",
    role: "Head de Produto",
    department: "Produto",
    status: "active",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
  },
  {
    id: 2,
    name: "Carlos Oliveira",
    email: "carlos.oliveira@empresa.com",
    role: "Desenvolvedor Sênior",
    department: "Tecnologia",
    status: "active",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
  },
  {
    id: 3,
    name: "Maria Costa",
    email: "maria.costa@empresa.com",
    role: "UX Designer",
    department: "Design",
    status: "active",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
  },
  {
    id: 4,
    name: "Pedro Santos",
    email: "pedro.santos@empresa.com",
    role: "Gerente de Vendas",
    department: "Comercial",
    status: "active",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro",
  },
  {
    id: 5,
    name: "Beatriz Ferreira",
    email: "beatriz.ferreira@empresa.com",
    role: "Analista de RH",
    department: "Pessoas",
    status: "away",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Beatriz",
  },
  {
    id: 6,
    name: "João Lima",
    email: "joao.lima@empresa.com",
    role: "Desenvolvedor Pleno",
    department: "Tecnologia",
    status: "active",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Joao",
  },
];

const departmentColors: Record<string, string> = {
  Produto: "bg-primary/10 text-primary border-primary/20",
  Tecnologia: "bg-accent/10 text-accent border-accent/20",
  Design: "bg-warning/10 text-warning border-warning/20",
  Comercial: "bg-success/10 text-success border-success/20",
  Pessoas: "bg-destructive/10 text-destructive border-destructive/20",
};

const People = () => {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("collaborators");
  const { isAdmin } = useUserPermissions();

  const handleInvite = (emails: string[], role: string, newHireData?: {
    isNewHire: boolean;
    hireDate?: Date;
    employmentType?: string;
  }) => {
    console.log("Inviting:", { emails, role, newHireData });
    // TODO: Implement actual invite logic with backend
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Pessoas</h1>
            <p className="text-muted-foreground">
              Gerencie os colaboradores da sua empresa
            </p>
          </div>
          <Button 
            className="gap-2 bg-gradient-primary hover:opacity-90 transition-opacity"
            onClick={() => setInviteModalOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Convidar Pessoa
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">248</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">👥</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold">235</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <span className="text-lg">✅</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Novos este mês</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <span className="text-lg">🆕</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Departamentos</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <span className="text-lg">🏢</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="collaborators" className="gap-2">
              <Users className="h-4 w-4" />
              Colaboradores
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="feedback" className="gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Feedback 30 Dias
                </TabsTrigger>
                <TabsTrigger value="nps" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  NPS
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="collaborators">
            {/* Search and Filters */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-lg font-heading">Colaboradores</CardTitle>
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, email ou cargo..."
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Colaborador</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {people.map((person) => (
                        <TableRow key={person.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={person.avatar} alt={person.name} />
                                <AvatarFallback>
                                  {person.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{person.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {person.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{person.role}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={departmentColors[person.department] || ""}
                            >
                              {person.department}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                person.status === "active"
                                  ? "bg-success/10 text-success border-success/20"
                                  : "bg-warning/10 text-warning border-warning/20"
                              }
                            >
                              {person.status === "active" ? "Ativo" : "Ausente"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackTab />
          </TabsContent>

          <TabsContent value="nps">
            <NPSTab />
          </TabsContent>
        </Tabs>
      </div>

      <InviteModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onInvite={handleInvite}
      />
    </AppLayout>
  );
};

export default People;
