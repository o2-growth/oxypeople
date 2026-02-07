import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TeamCard } from "@/components/teams/TeamCard";
import { CreateTeamDialog } from "@/components/teams/CreateTeamDialog";
import { TeamMembersDialog } from "@/components/teams/TeamMembersDialog";
import { Team, useTeams, useDeleteTeam, useTeamMembers } from "@/hooks/useTeams";
import { Users, Plus, Search, Loader2 } from "lucide-react";

export default function Teams() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});

  const { data: teams = [], isLoading } = useTeams();
  const deleteTeam = useDeleteTeam();

  // Fetch member counts for all teams
  useEffect(() => {
    const fetchMemberCounts = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const counts: Record<string, number> = {};
      
      for (const team of teams) {
        const { count } = await supabase
          .from("team_members")
          .select("*", { count: "exact", head: true })
          .eq("team_id", team.id);
        
        counts[team.id] = count || 0;
      }
      setMemberCounts(counts);
    };

    if (teams.length > 0) {
      fetchMemberCounts();
    }
  }, [teams]);

  const filteredTeams = teams.filter((team) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      team.name.toLowerCase().includes(query) ||
      team.description?.toLowerCase().includes(query) ||
      team.department?.toLowerCase().includes(query)
    );
  });

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setCreateDialogOpen(true);
  };

  const handleDelete = async (teamId: string) => {
    await deleteTeam.mutateAsync(teamId);
  };

  const handleManageMembers = (team: Team) => {
    setSelectedTeam(team);
    setMembersDialogOpen(true);
  };

  const handleCreateDialogClose = (open: boolean) => {
    setCreateDialogOpen(open);
    if (!open) {
      setEditingTeam(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Equipes</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as equipes da sua empresa
            </p>
          </div>
          <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Equipe
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar equipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Teams Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredTeams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {searchQuery ? "Nenhuma equipe encontrada" : "Nenhuma equipe criada"}
              </h3>
              <p className="text-muted-foreground text-center max-w-sm mb-4">
                {searchQuery
                  ? "Tente buscar com outros termos"
                  : "Crie sua primeira equipe para organizar os membros da empresa"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Equipe
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                memberCount={memberCounts[team.id] || 0}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onManageMembers={handleManageMembers}
              />
            ))}
          </div>
        )}

        {/* Dialogs */}
        <CreateTeamDialog
          open={createDialogOpen}
          onOpenChange={handleCreateDialogClose}
          editingTeam={editingTeam}
        />

        <TeamMembersDialog
          open={membersDialogOpen}
          onOpenChange={setMembersDialogOpen}
          team={selectedTeam}
        />
      </div>
    </AppLayout>
  );
}
