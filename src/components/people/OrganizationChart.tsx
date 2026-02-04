import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Expand, Minimize2, Loader2, Network } from "lucide-react";
import { useOrganizationHierarchy, type HierarchyNode } from "@/hooks/useOrganizationHierarchy";
import { OrgChartNodeControlled } from "./OrgChartNode";
import { ScrollArea } from "@/components/ui/scroll-area";

// Helper to collect all node IDs
function collectAllNodeIds(node: HierarchyNode): string[] {
  const ids = [node.id];
  node.children?.forEach((child) => {
    ids.push(...collectAllNodeIds(child));
  });
  return ids;
}

export function OrganizationChart() {
  const { data: hierarchy, isLoading, error } = useOrganizationHierarchy();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Get all node IDs for expand all functionality
  const allNodeIds = useMemo(() => {
    if (!hierarchy) return [];
    return collectAllNodeIds(hierarchy);
  }, [hierarchy]);

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedNodes(new Set(allNodeIds));
  }, [allNodeIds]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

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

  const hasAnyChildren = hierarchy.children && hierarchy.children.length > 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Network className="h-5 w-5" />
            Organograma
          </CardTitle>
          {hasAnyChildren && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                <Expand className="h-4 w-4 mr-2" />
                Expandir Tudo
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                <Minimize2 className="h-4 w-4 mr-2" />
                Colapsar Tudo
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="min-w-[300px] p-4">
            <OrgChartNodeControlled
              node={hierarchy}
              isExpanded={expandedNodes.has(hierarchy.id)}
              onToggle={() => toggleNode(hierarchy.id)}
              level={0}
              hasConnector={false}
              expandedNodes={expandedNodes}
              onToggleNode={toggleNode}
            />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
