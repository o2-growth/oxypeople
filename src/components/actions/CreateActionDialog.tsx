import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PersonSelector } from "@/components/objectives/PersonSelector";
import { useCreateAction, formatWeekLabel } from "@/hooks/useActions";
import { useObjectives } from "@/hooks/useObjectives";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CreateActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultWeek: string;
  weeks: string[];
  defaultObjectiveId?: string;
  defaultKeyResultId?: string;
}

export function CreateActionDialog({
  open,
  onOpenChange,
  defaultWeek,
  weeks,
  defaultObjectiveId,
  defaultKeyResultId,
}: CreateActionDialogProps) {
  const { user } = useAuth();
  const { data: objectives = [] } = useObjectives();
  const createAction = useCreateAction();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState(user?.id || "");
  const [weekBucket, setWeekBucket] = useState(defaultWeek);
  const [objectiveId, setObjectiveId] = useState(defaultObjectiveId || "none");
  const [keyResultId, setKeyResultId] = useState(defaultKeyResultId || "none");
  const [dueDate, setDueDate] = useState("");

  // Get KRs for selected objective
  const availableKRs = useMemo(() => {
    if (objectiveId === "none") return [];
    const obj = objectives.find((o) => o.id === objectiveId);
    return obj?.key_results || [];
  }, [objectiveId, objectives]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    try {
      await createAction.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        owner_user_id: ownerId || user?.id || "",
        week_bucket: weekBucket,
        objective_id: objectiveId !== "none" ? objectiveId : undefined,
        key_result_id: keyResultId !== "none" ? keyResultId : undefined,
        due_date: dueDate || undefined,
      });
      toast.success("Ação criada!");
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error("Erro ao criar ação");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setOwnerId(user?.id || "");
    setWeekBucket(defaultWeek);
    setObjectiveId(defaultObjectiveId || "none");
    setKeyResultId(defaultKeyResultId || "none");
    setDueDate("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Ação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O que precisa ser feito?"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Semana</Label>
              <Select value={weekBucket} onValueChange={setWeekBucket}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weeks.map((w) => (
                    <SelectItem key={w} value={w}>
                      {formatWeekLabel(w)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data limite</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Responsável</Label>
            <PersonSelector
              value={ownerId}
              onValueChange={setOwnerId}
            />
          </div>

          <div className="space-y-2">
            <Label>Objetivo (opcional)</Label>
            <Select value={objectiveId} onValueChange={(v) => { setObjectiveId(v); setKeyResultId("none"); }}>
              <SelectTrigger>
                <SelectValue placeholder="Vincular a objetivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {objectives.map((obj) => (
                  <SelectItem key={obj.id} value={obj.id}>
                    {obj.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availableKRs.length > 0 && (
            <div className="space-y-2">
              <Label>Key Result (opcional)</Label>
              <Select value={keyResultId} onValueChange={setKeyResultId}>
                <SelectTrigger>
                  <SelectValue placeholder="Vincular a KR" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {availableKRs.map((kr) => (
                    <SelectItem key={kr.id} value={kr.id}>
                      {kr.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createAction.isPending}>
            {createAction.isPending ? "Criando..." : "Criar Ação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
