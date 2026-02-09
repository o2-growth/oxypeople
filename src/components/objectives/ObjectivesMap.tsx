import { useState, useRef, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize, Target } from "lucide-react";
import { ObjectiveWithDetails } from "@/hooks/useObjectives";
import { ObjectiveMapNode } from "./ObjectiveMapNode";

interface ObjectivesMapProps {
  tree: ObjectiveWithDetails[];
  isLoading: boolean;
  onSelectObjective: (objective: ObjectiveWithDetails) => void;
}

export function ObjectivesMap({ tree, isLoading, onSelectObjective }: ObjectivesMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [transform, setTransform] = useState({ x: 40, y: 40, scale: 0.85 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.2, Math.min(2, prev.scale + delta)),
    }));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-map-card]")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  }, [transform.x, transform.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetView = useCallback(() => {
    setTransform({ x: 40, y: 40, scale: 0.85 });
  }, []);

  const zoomIn = () => setTransform((p) => ({ ...p, scale: Math.min(2, p.scale + 0.15) }));
  const zoomOut = () => setTransform((p) => ({ ...p, scale: Math.max(0.2, p.scale - 0.15) }));

  if (isLoading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-muted-foreground">Carregando mapa...</div>
      </Card>
    );
  }

  if (tree.length === 0) {
    return (
      <Card className="h-[600px] flex flex-col items-center justify-center">
        <Target className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Mapa vazio</h3>
        <p className="text-muted-foreground text-sm">
          Crie objetivos para visualizar o mapa hierárquico.
        </p>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden h-[600px]">
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card" onClick={zoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card" onClick={zoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 bg-card" onClick={resetView}>
          <Maximize className="h-4 w-4" />
        </Button>
      </div>

      {/* Scale indicator */}
      <div className="absolute bottom-3 right-3 z-10 text-[10px] text-muted-foreground bg-card/80 px-2 py-1 rounded border">
        {Math.round(transform.scale * 100)}%
      </div>

      {/* Pan/zoom canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={contentRef}
          className="origin-top-left transition-transform duration-75"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
        >
          <div className="flex flex-col gap-10">
            {tree.map((objective) => (
              <ObjectiveMapNode
                key={objective.id}
                objective={objective}
                onSelectObjective={onSelectObjective}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
