import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ObjectiveWithDetails } from "@/hooks/useObjectives";
import { cn } from "@/lib/utils";

interface ChildWeightEditorProps {
  parentId: string;
  children: ObjectiveWithDetails[];
  canEdit: boolean;
}

export function ChildWeightEditor({ parentId, children, canEdit }: ChildWeightEditorProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load current weights from objective_relations
    const loadWeights = async () => {
      const { data } = await supabase
        .from("objective_relations")
        .select("child_objective_id, weight_percentage")
        .eq("parent_objective_id", parentId);

      const w: Record<string, number> = {};
      children.forEach((c) => {
        const rel = data?.find((r) => r.child_objective_id === c.id);
        w[c.id] = rel ? Number(rel.weight_percentage) : 0;
      });

      // If all weights are 0, distribute evenly
      const total = Object.values(w).reduce((s, v) => s + v, 0);
      if (total === 0 && children.length > 0) {
        const base = Math.floor(100 / children.length);
        const remainder = 100 - base * children.length;
        children.forEach((c, i) => {
          w[c.id] = base + (i < remainder ? 1 : 0);
        });
      }

      setWeights(w);
    };
    loadWeights();
  }, [parentId, children]);

  const totalWeight = Object.values(weights).reduce((s, v) => s + v, 0);
  const isValid = totalWeight === 100;

  const distributeEvenly = () => {
    const count = children.length;
    if (count === 0) return;
    const base = Math.floor(100 / count);
    const remainder = 100 - base * count;
    const w: Record<string, number> = {};
    children.forEach((c, i) => {
      w[c.id] = base + (i < remainder ? 1 : 0);
    });
    setWeights(w);
  };

  const handleSave = async () => {
    if (!isValid) {
      toast.error(`A soma dos pesos deve ser 100% (atual: ${totalWeight}%)`);
      return;
    }

    setIsSaving(true);
    try {
      for (const child of children) {
        await supabase
          .from("objective_relations")
          .update({ weight_percentage: weights[child.id] || 0 })
          .eq("parent_objective_id", parentId)
          .eq("child_objective_id", child.id);
      }

      queryClient.invalidateQueries({ queryKey: ["objectives"] });
      toast.success("Pesos atualizados!");
      setIsEditing(false);
    } catch {
      toast.error("Erro ao atualizar pesos");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5">
        <Scale className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="flex items-center gap-1.5 flex-wrap">
          {children.map((child) => (
            <Badge key={child.id} variant="outline" className="text-[10px] px-1.5 py-0 h-5">
              {child.title.substring(0, 20)}{child.title.length > 20 ? "…" : ""}: {weights[child.id] || 0}%
            </Badge>
          ))}
        </div>
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] px-2 ml-auto"
            onClick={() => setIsEditing(true)}
          >
            Editar pesos
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="px-3 py-2 space-y-2 bg-muted/30 rounded-md mx-2 mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Pesos dos filhos</span>
          <Badge variant={isValid ? "default" : "destructive"} className="text-[10px]">
            {totalWeight}%
          </Badge>
          {!isValid && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={distributeEvenly}>
            Igualar
          </Button>
          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            className="h-6 text-[10px] px-2 gap-1"
            onClick={handleSave}
            disabled={!isValid || isSaving}
          >
            <Check className="h-3 w-3" />
            Salvar
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        {children.map((child) => (
          <div key={child.id} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground flex-1 truncate">
              {child.title}
            </span>
            <Input
              type="number"
              min={0}
              max={100}
              value={weights[child.id] || 0}
              onChange={(e) =>
                setWeights((prev) => ({ ...prev, [child.id]: Number(e.target.value) }))
              }
              className="h-7 w-16 text-xs"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
