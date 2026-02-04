import { useState, useMemo } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  UserPlus,
  MoreHorizontal,
  Users,
  ClipboardList,
  BarChart3,
  Loader2,
  UserX,
  UserCheck,
  Mail,
  Network,
} from "lucide-react";
import { InviteModal } from "@/components/company/InviteModal";
import { FeedbackTab } from "@/components/people/FeedbackTab";
import { NPSTab } from "@/components/people/NPSTab";
import { OrganizationChart } from "@/components/people/OrganizationChart";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import {
  usePeopleList,
  usePeopleStats,
  useInviteMember,
  useUpdateMemberStatus,
} from "@/hooks/usePeopleList";

const statusLabels: Record<string, string> = {
  active: "Ativo",
  invited: "Convidado",
  pending: "Pendente",
  inactive: "Inativo",
};

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  invited: "bg-accent/10 text-accent border-accent/20",
  pending: "bg-warning/10 text-warning border-warning/20",
  inactive: "bg-muted text-muted-foreground",
};

const roleLabels: Record<string, string> = {
  owner: "Proprietário",
  admin: "Admin",
  manager: "Gestor",
  member: "Membro",
};

const People = () => {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("collaborators");
  const [searchQuery, setSearchQuery] = useState("");

  const { isAdmin } = useUserPermissions();
  const { data: people, isLoading: isLoadingPeople } = usePeopleList();
  const { data: stats, isLoading: isLoadingStats } = usePeopleStats();
  const inviteMember = useInviteMember();
  const updateStatus = useUpdateMemberStatus();

  const filteredPeople = useMemo(() => {
    if (!people) return [];
    if (!searchQuery.trim()) return people;

    const query = searchQuery.toLowerCase();
    return people.filter(
      (person) =>
        person.user?.full_name?.toLowerCase().includes(query) ||
        person.user?.email?.toLowerCase().includes(query) ||
        person.position?.toLowerCase().includes(query) ||
        person.department_info?.name?.toLowerCase().includes(query)
    );
  }, [people, searchQuery]);

  const handleInvite = (
    emails: string[],
    role: string,
    newHireData?: {
      isNewHire: boolean;
      hireDate?: Date;
      employmentType?: string;
    }
  ) => {
    inviteMember.mutate({ emails, role, newHireData });
  };

  const handleToggleStatus = (
    membershipId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    updateStatus.mutate({ membershipId, status: newStatus });
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
          {isAdmin && (
            <Button
              className="gap-2 bg-gradient-primary hover:opacity-90 transition-opacity"
              onClick={() => setInviteModalOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              Convidar Pessoa
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">
                    {isLoadingStats ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      stats?.total || 0
                    )}
                  </p>
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
                  <p className="text-2xl font-bold">
                    {isLoadingStats ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      stats?.active || 0
                    )}
                  </p>
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
                  <p className="text-2xl font-bold">
                    {isLoadingStats ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      stats?.newThisMonth || 0
                    )}
                  </p>
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
                  <p className="text-2xl font-bold">
                    {isLoadingStats ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      stats?.departments || 0
                    )}
                  </p>
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
            <TabsTrigger value="orgchart" className="gap-2">
              <Network className="h-4 w-4" />
              Organograma
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
                  <CardTitle className="text-lg font-heading">
                    Colaboradores
                  </CardTitle>
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, email ou cargo..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingPeople ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredPeople.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">
                      {searchQuery
                        ? "Nenhum resultado encontrado"
                        : "Nenhum colaborador"}
                    </h3>
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? "Tente buscar por outro termo"
                        : "Convide membros para começar"}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Colaborador</TableHead>
                          <TableHead>Cargo</TableHead>
                          <TableHead>Departamento</TableHead>
                          <TableHead>Função</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPeople.map((person) => {
                          const initials =
                            person.user?.full_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2) || "?";

                          return (
                            <TableRow
                              key={person.id}
                              className="hover:bg-muted/30"
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage
                                      src={person.user?.avatar_url || undefined}
                                      alt={person.user?.full_name || ""}
                                    />
                                    <AvatarFallback>{initials}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">
                                      {person.user?.full_name || "Sem nome"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {person.user?.email}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {person.position || (
                                  <span className="text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                {person.department_info ? (
                                  <Badge
                                    variant="outline"
                                    style={{
                                      backgroundColor: `${person.department_info.color}15`,
                                      color: person.department_info.color || undefined,
                                      borderColor: `${person.department_info.color}30`,
                                    }}
                                  >
                                    {person.department_info.name}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">
                                  {roleLabels[person.role || "member"]}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    statusColors[person.status] || ""
                                  }
                                >
                                  {statusLabels[person.status] || person.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {isAdmin && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() =>
                                          window.open(
                                            `mailto:${person.user?.email}`,
                                            "_blank"
                                          )
                                        }
                                      >
                                        <Mail className="h-4 w-4 mr-2" />
                                        Enviar email
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      {person.status === "active" ? (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleToggleStatus(
                                              person.id,
                                              person.status
                                            )
                                          }
                                          className="text-destructive"
                                        >
                                          <UserX className="h-4 w-4 mr-2" />
                                          Desativar
                                        </DropdownMenuItem>
                                      ) : (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleToggleStatus(
                                              person.id,
                                              person.status
                                            )
                                          }
                                        >
                                          <UserCheck className="h-4 w-4 mr-2" />
                                          Ativar
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orgchart">
            <OrganizationChart />
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
