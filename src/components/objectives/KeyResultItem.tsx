import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Pencil, Check, X } from "lucide-react";
import { useUpdateKeyResult } from "@/hooks/useObjectives";
import { toast } from "sonner";

export interface KeyResult {
  id: string;
  title: string;
  current_value: number;
  target_value: number;
  unit: string | null;
}

interface KeyResultItemProps {
  keyResult: KeyResult;
  canEdit?: boolean;
}

export function KeyResultItem({ keyResult, canEdit = false }: KeyResultItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(keyResult.current_value);
  const updateKeyResult = useUpdateKeyResult();

  const progress = Math.min(
    (keyResult.current_value / keyResult.target_value) * 100,
    100
  );
  const isComplete = progress >= 100;

  const handleSave = async () => {
    try {
      await updateKeyResult.mutateAsync({
        id: keyResult.id,
        current_value: editValue,
      });
      setIsEditing(false);
      toast.success("Key Result atualizado!");
    } catch (error) {
      toast.error("Erro ao atualizar");
    }
  };

  const handleCancel = () => {
    setEditValue(keyResult.current_value);
    setIsEditing(false);
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
      <div className="shrink-0 mt-0.5">
        {isComplete ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <p className="text-sm font-medium text-foreground">{keyResult.title}</p>

        <div className="flex items-center gap-3">
          <Progress value={progress} className="h-1.5 flex-1" />

          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(Number(e.target.value))}
                className="w-20 h-7 text-xs"
                step="0.01"
              />
              <span className="text-xs text-muted-foreground">
                / {keyResult.target_value} {keyResult.unit || ""}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-primary hover:text-primary"
                onClick={handleSave}
                disabled={updateKeyResult.isPending}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={handleCancel}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {keyResult.current_value} / {keyResult.target_value}{" "}
                {keyResult.unit || ""}
              </span>
              {canEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
