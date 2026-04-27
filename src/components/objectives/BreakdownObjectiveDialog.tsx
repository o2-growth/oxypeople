import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PersonSelector } from "./PersonSelector";
import { DepartmentSelector } from "./DepartmentSelector";
import { ObjectiveWithDetails, ObjectiveType, useCreateObjective } from "@/hooks/useObjectives";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, AlertTriangle, Layers, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreakdownObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentObjective: ObjectiveWithDetails;
}

interface ChildEntry {
  id: string;
  title: string;
  ownerId: string;
  department: string;
  weight: number;
}

const childTypeMap: Record<ObjectiveType, ObjectiveType> = {
  strategic: "tactical",
  tactical: "operational",
  operational: "operational",
  personal: "operational",
  team: "operational",
  individual: "operational",
};

const childTypeLabels: Record<ObjectiveType, { label: string; icon: typeof Layers }> = {
  tactical: { label: "Tático", icon: Layers },
  operational: { label: "Operacional", icon: Zap },
  strategic: { label: "Estratégico", icon: Layers },
  personal: { label: "Pessoal", icon: Layers },
  team: { label: "Time", icon: Layers },
  individual: { label: "Individual", icon: Layers },
};

let nextId = 0;
const genId = () => `child-${++nextId}`;

export function BreakdownObjectiveDialog({
  open,
  onOpenChange,
  parentObjective,
}: BreakdownObjectiveDialogProps) {
  const childType = childTypeMap[parentObjective.type];
  const childLabel = childTypeLabels[childType];
  const queryClient = useQueryClient();
  const createObjective = useCreateObjective();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [children, setChildren] = useState<ChildEntry[]>([
    { id: genId(), title: "", ownerId: "", department: "", weight: 50 },
    { id: genId(), title: "", ownerId: "", department: "", weight: 50 },
  ]);

  const totalWeight = children.reduce((sum, c) => sum + (c.weight || 0), 0);
  const isWeightValid = totalWeight === 100;

  const addChild = () => {
    setChildren((prev) => [...prev, { id: genId(), title: "", ownerId: "", department: "", weight: 0 }]);
  };

  const removeChild = (id: string) => {
    setChildren((prev) => prev.filter((c) => c.id !== id));
  };

  const updateChild = (id: string, field: keyof ChildEntry, value: string | number) => {
    setChildren((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const distributeEvenly = () => {
    const count = children.length;
    if (count === 0) return;
    const base = Math.floor(100 / count);
    const remainder = 100 - base * count;
    setChildren((prev) =>
      prev.map((c, i) => ({ ...c, weight: base + (i < remainder ? 1 : 0) }))
    );
  };

  const handleSubmit = async () => {
    // Validate
    const emptyTitles = children.filter((c) => !c.title.trim());
    if (emptyTitles.length > 0) {
      toast.error("Todos os objetivos filhos precisam de um título");
      return;
    }

    const emptyOwners = children.filter((c) => !c.ownerId);
    if (emptyOwners.length > 0) {
      toast.error("Todos os objetivos filhos precisam de um responsável");
      return;
    }

    if (!isWeightValid) {
      toast.error(`A soma dos pesos deve ser 100% (atual: ${totalWeight}%)`);
      return;
    }

    setIsSubmitting(true);
    try {
      // Create each child objective sequentially
      for (const child of children) {
        const result = await createObjective.mutateAsync({
          title: child.title,
          type: childType,
          owner_id: child.ownerId,
          parent_id: parentObjective.id,
          period_id: parentObjective.period_id || undefined,
          department: child.department || parentObjective.department || undefined,
          visibility: parentObjective.visibility as "public" | "company" | "private",
          description: `Derivado de: ${parentObjective.title}`,
        });

        // Update the weight in objective_relations
        if (result?.id) {
          await supabase
            .from("objective_relations")
            .update({ weight_percentage: child.weight })
            .eq("parent_objective_id", parentObjective.id)
            .eq("child_objective_id", result.id);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["objectives"] });
      queryClient.invalidateQueries({ queryKey: ["objectives-filtered"] });
      toast.success(`${children.length} objetivos filhos criados com sucesso!`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error breaking down objective:", error);
      toast.error("Erro ao criar objetivos filhos");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Quebrar Objetivo em Filhos
          </DialogTitle>
          <DialogDescription>
            Cascateie "<span className="font-medium">{parentObjective.title}</span>" em
            objetivos {childLabel.label.toLowerCase()}s com peso e responsável.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Inherited context */}
          <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
            <p>
              <span className="font-medium text-foreground">Período herdado:</span>{" "}
              {parentObjective.period_id ? "Sim (do objetivo pai)" : "Nenhum definido"}
            </p>
            <p>
              <span className="font-medium text-foreground">Visibilidade herdada:</span>{" "}
              {parentObjective.visibility === "company" ? "Empresa" : parentObjective.visibility === "private" ? "Privado" : "Público"}
            </p>
          </div>

          {/* Weight status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Pesos</span>
              <Badge
                variant={isWeightValid ? "default" : "destructive"}
                className="text-xs"
              >
                {totalWeight}% / 100%
              </Badge>
              {!isWeightValid && (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={distributeEvenly}>
              Distribuir igualmente
            </Button>
          </div>

          {/* Children list */}
          <div className="space-y-3">
            {children.map((child, index) => (
              <div key={child.id} className="p-3 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {childLabel.label} {index + 1}
                  </span>
                  {children.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeChild(child.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                <div>
                  <Label className="text-xs">Título *</Label>
                  <Input
                    placeholder={`Título do objetivo ${childLabel.label.toLowerCase()}`}
                    value={child.title}
                    onChange={(e) => updateChild(child.id, "title", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Responsável *</Label>
                    <PersonSelector
                      value={child.ownerId}
                      onValueChange={(v) => updateChild(child.id, "ownerId", v)}
                      placeholder="Selecione"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Área</Label>
                    <DepartmentSelector
                      value={child.department}
                      onValueChange={(v) => updateChild(child.id, "department", v)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Peso (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={child.weight}
                      onChange={(e) => updateChild(child.id, "weight", Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" className="w-full gap-2" onClick={addChild}>
            <Plus className="h-4 w-4" />
            Adicionar {childLabel.label}
          </Button>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !isWeightValid}
            >
              {isSubmitting
                ? "Criando..."
                : `Criar ${children.length} ${childLabel.label}${children.length > 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
