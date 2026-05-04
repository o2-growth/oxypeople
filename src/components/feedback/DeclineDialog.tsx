import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle } from "lucide-react";
import { useDeclineFeedback } from "@/hooks/useDeclineFeedback";
import { feedbackDeclineSchema } from "@/lib/validation/feedbackRequestSchema";
import type { FeedbackInboxRow } from "@/hooks/useFeedbackInbox";

interface DeclineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FeedbackInboxRow | null;
}

export function DeclineDialog({ open, onOpenChange, item }: DeclineDialogProps) {
  const decline = useDeclineFeedback();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
    }
  }, [open, item?.id]);

  if (!item) return null;

  const handleSubmit = async () => {
    const parsed = feedbackDeclineSchema.safeParse({ declined_reason: reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Motivo inválido");
      return;
    }
    try {
      await decline.mutateAsync({
        id: item.id,
        declined_reason: parsed.data.declined_reason,
        createdAt: item.created_at,
      });
      onOpenChange(false);
    } catch {
      // toast cuidou
    }
  };

  const charCount = reason.length;
  const valid = charCount >= 10 && charCount <= 500;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recusar pedido</DialogTitle>
          <DialogDescription>
            O requester verá seu motivo. Seja respeitoso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <label htmlFor="reason" className="text-sm font-medium">
            Por que você não pode responder?
          </label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Ex.: Não trabalhei diretamente com essa pessoa nos últimos meses."
            className="min-h-[100px]"
            maxLength={500}
          />
          <div className="flex items-center justify-between text-xs">
            <span className={error ? "text-destructive" : "text-muted-foreground"}>
              {error ?? "Mínimo 10 caracteres."}
            </span>
            <span className="text-muted-foreground">{charCount}/500</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Voltar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!valid || decline.isPending}
            className="gap-1.5"
          >
            {decline.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Recusar pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
