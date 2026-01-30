import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MembersList, Member } from "@/components/company/MembersList";
import { InviteModal } from "@/components/company/InviteModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Users, 
  UserPlus, 
  Settings, 
  Globe, 
  Mail,
  Search,
  Shield,
  Clock
} from "lucide-react";

const mockMembers: Member[] = [
  { id: "1", name: "João Silva", email: "joao@empresa.com", avatar: "", initials: "JS", role: "owner", status: "active", department: "Diretoria", joinedAt: "Jan 2023" },
  { id: "2", name: "Ana Costa", email: "ana@empresa.com", avatar: "", initials: "AC", role: "admin", status: "active", department: "RH", joinedAt: "Mar 2023" },
  { id: "3", name: "Carlos Santos", email: "carlos@empresa.com", avatar: "", initials: "CS", role: "manager", status: "active", department: "Tecnologia", joinedAt: "Jun 2023" },
  { id: "4", name: "Maria Oliveira", email: "maria@empresa.com", avatar: "", initials: "MO", role: "member", status: "active", department: "Marketing", joinedAt: "Ago 2023" },
  { id: "5", name: "Pedro Lima", email: "pedro@empresa.com", avatar: "", initials: "PL", role: "member", status: "active", department: "Vendas", joinedAt: "Set 2023" },
  { id: "6", name: "Fernanda Souza", email: "fernanda@empresa.com", avatar: "", initials: "FS", role: "member", status: "invited", department: "Produto", joinedAt: "-" },
  { id: "7", name: "Lucas Rocha", email: "lucas@empresa.com", avatar: "", initials: "LR", role: "member", status: "invited", department: "Design", joinedAt: "-" },
];

const stats = [
  { label: "Total de Membros", value: 80, icon: Users, color: "text-primary" },
  { label: "Administradores", value: 5, icon: Shield, color: "text-red-500" },
  { label: "Gestores", value: 12, icon: Users, color: "text-blue-500" },
  { label: "Convites Pendentes", value: 8, icon: Clock, color: "text-yellow-500" },
];

export default function Company() {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = mockMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Empresa</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seu workspace e membros da equipe
            </p>
          </div>
          <Button className="gap-2" onClick={() => setInviteModalOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Convidar Membros
          </Button>
        </div>

        {/* Company Info Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  PH
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-foreground">People Hub Corp</h2>
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    Plano Pro
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Globe className="h-4 w-4" />
                    <span>peoplehub.com</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    <span>admin@peoplehub.com</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>80 membros</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Editar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Members Section */}
        <Tabs defaultValue="members" className="w-full">
          <TabsList>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Membros
            </TabsTrigger>
            <TabsTrigger value="departments" className="gap-2">
              <Building2 className="h-4 w-4" />
              Departamentos
            </TabsTrigger>
            <TabsTrigger value="invites" className="gap-2">
              <Mail className="h-4 w-4" />
              Convites
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-6 space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar membros..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <MembersList members={filteredMembers} />
          </TabsContent>

          <TabsContent value="departments" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {["Tecnologia", "RH", "Marketing", "Vendas", "Produto", "Design", "Diretoria", "Financeiro"].map((dept) => (
                <Card key={dept} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{dept}</p>
                          <p className="text-sm text-muted-foreground">
                            {Math.floor(Math.random() * 15) + 3} membros
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="invites" className="mt-6">
            <MembersList 
              members={mockMembers.filter(m => m.status === "invited")} 
            />
          </TabsContent>
        </Tabs>

        <InviteModal 
          open={inviteModalOpen} 
          onOpenChange={setInviteModalOpen}
        />
      </div>
    </AppLayout>
  );
}
