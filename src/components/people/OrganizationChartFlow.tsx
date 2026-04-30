import { useCallback, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Network, Search, Download, RotateCcw } from "lucide-react";
import { toPng } from "html-to-image";
import { useOrganizationHierarchy, type HierarchyNode } from "@/hooks/useOrganizationHierarchy";
import { useAuth } from "@/contexts/AuthContext";
import { buildOrgGraph, flattenHierarchy, type OrgFlowNodeData } from "./org-layout";
import { orgNodeTypes } from "./orgNodeTypes";
import { OrgMemberDrawer } from "./OrgMemberDrawer";
import { trackEvent } from "@/lib/analytics";

type DepartmentOption = { id: string; name: string };

export function OrganizationChartFlow() {
  const { data: hierarchy, isLoading, error } = useOrganizationHierarchy();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("all");
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [selected, setSelected] = useState<HierarchyNode | null>(null);
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const departmentOptions = useMemo<DepartmentOption[]>(() => {
    if (!hierarchy) return [];
    return flattenHierarchy(hierarchy)
      .filter((n) => n.type === "department")
      .map((n) => ({ id: n.id, name: n.name }));
  }, [hierarchy]);

  const myUserNodeId = user ? `member-${user.id}` : null;

  const filterMatch = useCallback(
    (node: HierarchyNode) => {
      if (search) {
        const q = search.toLowerCase();
        const haystack = [node.name, node.role, node.position, node.email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (departmentId !== "all") {
        if (node.id !== departmentId && node.department !== departmentNameFromId(departmentOptions, departmentId)) {
          return false;
        }
      }
      if (scope === "mine" && myUserNodeId) {
        if (node.id !== myUserNodeId) return false;
      }
      return true;
    },
    [search, departmentId, scope, myUserNodeId, departmentOptions],
  );

  const graph = useMemo(() => {
    if (!hierarchy) return { nodes: [], edges: [] };
    const hasFilter = search.length > 0 || departmentId !== "all" || scope === "mine";
    return buildOrgGraph(hierarchy, hasFilter ? filterMatch : () => false);
  }, [hierarchy, search, departmentId, scope, filterMatch]);

  const handleNodeClick = useCallback(
    (_: unknown, node: Node<OrgFlowNodeData>) => {
      setSelected(node.data);
      trackEvent("orgchart_node_clicked", { type: node.data.type });
    },
    [],
  );

  const handleResetFilters = () => {
    setSearch("");
    setDepartmentId("all");
    setScope("all");
  };

  const handleExportPng = useCallback(async () => {
    if (!wrapperRef.current) return;
    try {
      const pane = wrapperRef.current.querySelector(".react-flow__viewport") as HTMLElement | null;
      const target = pane ?? wrapperRef.current;
      const dataUrl = await toPng(target, {
        backgroundColor: "white",
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `organograma-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
      trackEvent("orgchart_exported", { format: "png" });
    } catch (err) {
      console.error("[orgchart] export failed", err);
    }
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !hierarchy) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Network className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {error ? "Erro ao carregar organograma" : "Organograma vazio"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {error
              ? "Não foi possível carregar a estrutura organizacional."
              : "Configure departamentos e equipes para visualizar o organograma."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasFilter = search.length > 0 || departmentId !== "all" || scope === "mine";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Network className="h-5 w-5" />
            Organograma
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPng} className="gap-1.5">
              <Download className="h-4 w-4" />
              PNG
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail, cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <Select value={departmentId} onValueChange={setDepartmentId}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os departamentos</SelectItem>
              {departmentOptions.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {myUserNodeId && (
            <Select value={scope} onValueChange={(v) => setScope(v as "all" | "mine")}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda empresa</SelectItem>
                <SelectItem value="mine">Apenas eu</SelectItem>
              </SelectContent>
            </Select>
          )}
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Limpar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div ref={wrapperRef} className="h-[640px] w-full rounded-md border bg-background">
          <ReactFlow
            nodes={graph.nodes}
            edges={graph.edges}
            nodeTypes={orgNodeTypes}
            onInit={(instance) => {
              flowInstanceRef.current = instance;
              instance.fitView({ padding: 0.2, duration: 300 });
            }}
            onNodeClick={handleNodeClick}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            proOptions={{ hideAttribution: true }}
            minZoom={0.2}
            maxZoom={1.5}
            fitView
          >
            <Background gap={24} size={1} />
            <Controls showInteractive={false} />
            <MiniMap
              pannable
              zoomable
              nodeColor={(n) => {
                const data = n.data as OrgFlowNodeData | undefined;
                if (!data) return "hsl(var(--muted))";
                if (data.isDimmed) return "hsl(var(--muted))";
                return data.color || "hsl(var(--primary))";
              }}
              maskColor="hsl(var(--muted) / 0.4)"
            />
          </ReactFlow>
        </div>
      </CardContent>
      <OrgMemberDrawer node={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </Card>
  );
}

function departmentNameFromId(options: DepartmentOption[], id: string): string | undefined {
  return options.find((o) => o.id === id)?.name;
}
