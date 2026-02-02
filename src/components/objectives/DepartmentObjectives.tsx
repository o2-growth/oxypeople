import { useState } from "react";
import { ChevronDown, ChevronRight, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ObjectiveCard } from "./ObjectiveCard";
import { ObjectiveWithDetails } from "@/hooks/useObjectives";
import { GroupedObjectives } from "@/hooks/useObjectivesFilters";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface DepartmentObjectivesProps {
  groupedObjectives: GroupedObjectives;
  onEditObjective?: (objective: ObjectiveWithDetails) => void;
}

export function DepartmentObjectives({
  groupedObjectives,
  onEditObjective,
}: DepartmentObjectivesProps) {
  const [openDepartments, setOpenDepartments] = useState<Set<string>>(
    new Set(Object.keys(groupedObjectives))
  );

  const toggleDepartment = (dept: string) => {
    setOpenDepartments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dept)) {
        newSet.delete(dept);
      } else {
        newSet.add(dept);
      }
      return newSet;
    });
  };

  const departments = Object.keys(groupedObjectives).sort();

  if (departments.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhum objetivo encontrado</h3>
        <p className="text-muted-foreground">
          Não há objetivos correspondentes aos filtros aplicados.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {departments.map((dept) => {
        const objectives = groupedObjectives[dept];
        const isOpen = openDepartments.has(dept);
        const avgProgress = Math.round(
          objectives.reduce((sum, obj) => sum + obj.progress, 0) / objectives.length
        );

        return (
          <Collapsible
            key={dept}
            open={isOpen}
            onOpenChange={() => toggleDepartment(dept)}
          >
            <div className="border rounded-lg overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    {isOpen ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      Objetivos {dept}
                    </h3>
                    <Badge variant="secondary">
                      {objectives.length} objetivo{objectives.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Progresso médio:{" "}
                      <span className="font-medium text-foreground">
                        {avgProgress}%
                      </span>
                    </div>
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          avgProgress >= 75
                            ? "bg-green-500"
                            : avgProgress >= 50
                            ? "bg-yellow-500"
                            : avgProgress >= 25
                            ? "bg-orange-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${avgProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="p-4 space-y-4 bg-background">
                  {objectives.map((objective) => (
                    <ObjectiveCard
                      key={objective.id}
                      objective={objective}
                      onEdit={onEditObjective}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
