import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Network } from "lucide-react";
import { useOrganizationHierarchy } from "@/hooks/useOrganizationHierarchy";
import { OrgRootCard, OrgDepartmentColumn, OrgMemberCard } from "./OrgChartNode";
import { ScrollArea } from "@/components/ui/scroll-area";

export function OrganizationChart() {
  const { data: hierarchy, isLoading, error } = useOrganizationHierarchy();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Network className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Erro ao carregar organograma</h3>
          <p className="text-muted-foreground">
            Não foi possível carregar a estrutura organizacional.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!hierarchy) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Network className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Organograma vazio</h3>
          <p className="text-muted-foreground">
            Configure departamentos e equipes para visualizar o organograma.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Separate children into departments and unassigned members
  const departments = hierarchy.children?.filter((c) => c.type === "department") || [];
  const unassigned = hierarchy.children?.filter((c) => c.type === "member") || [];
  const orphanTeams = hierarchy.children?.filter((c) => c.type === "team") || [];

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <Network className="h-5 w-5" />
          Organograma
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="flex flex-col items-center min-w-max pb-8">
            {/* Root / CEO card */}
            <OrgRootCard node={hierarchy} />

            {/* Vertical connector from CEO to horizontal line */}
            {departments.length > 0 && (
              <div className="w-px h-8 bg-border" />
            )}

            {/* Horizontal line spanning all departments */}
            {departments.length > 0 && (
              <div className="relative w-full">
                <div
                  className="absolute top-0 left-0 right-0 h-px bg-border"
                  style={{
                    marginLeft: `calc(50% / ${departments.length})`,
                    marginRight: `calc(50% / ${departments.length})`,
                  }}
                />
              </div>
            )}

            {/* Department columns */}
            <div className="flex gap-4 items-start">
              {departments.map((dept) => (
                <OrgDepartmentColumn key={dept.id} node={dept} />
              ))}
            </div>

            {/* Orphan teams */}
            {orphanTeams.length > 0 && (
              <div className="mt-8 w-full">
                <p className="text-sm font-medium text-muted-foreground mb-2">Equipes sem departamento</p>
                <div className="flex gap-4 items-start">
                  {orphanTeams.map((team) => (
                    <OrgDepartmentColumn key={team.id} node={team} />
                  ))}
                </div>
              </div>
            )}

            {/* Unassigned members */}
            {unassigned.length > 0 && (
              <div className="mt-8 w-full">
                <p className="text-sm font-medium text-muted-foreground mb-2">Sem departamento</p>
                <div className="flex gap-2 flex-wrap">
                  {unassigned.map((m) => (
                    <div key={m.id} className="w-[220px]">
                      <OrgMemberCard node={m} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
