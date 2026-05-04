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
import { Loader2, Send } from "lucide-react";
import { useRespondFeedback } from "@/hooks/useRespondFeedback";
import { feedbackResponseSchema } from "@/lib/validation/feedbackRequestSchema";
import type { FeedbackInboxRow } from "@/hooks/useFeedbackInbox";
import { FeedbackVisibilityBadge } from "./FeedbackVisibilityBadge";

interface RespondDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FeedbackInboxRow | null;
}

export function RespondDialog({ open, onOpenChange, item }: RespondDialogProps) {
  const respond = useRespondFeedback();
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setResponse("");
      setError(null);
    }
  }, [open, item?.id]);

  if (!item) return null;

  const handleSubmit = async () => {
    const parsed = feedbackResponseSchema.safeParse({ response });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Resposta inválida");
      return;
    }
    try {
      await respond.mutateAsync({
        id: item.id,
        response: parsed.data.response,
        visibility: item.visibility,
        createdAt: item.created_at,
      });
      onOpenChange(false);
    } catch {
      // toast já cuidou
    }
  };

  const charCount = response.length;
  const valid = charCount >= 50 && charCount <= 5000;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Responder feedback</DialogTitle>
          <DialogDescription>
            Sobre <strong>{item.subject?.full_name ?? "alguém"}</strong>, pedido por{" "}
            <strong>{item.requester?.full_name ?? "alguém"}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md bg-muted/40 p-3">
            <p className="text-sm leading-snug whitespace-pre-line">{item.question}</p>
          </div>

          <FeedbackVisibilityBadge visibility={item.visibility} />

          <div className="space-y-1.5">
            <label htmlFor="response" className="text-sm font-medium">
              Sua resposta
            </label>
            <Textarea
              id="response"
              value={response}
              onChange={(e) => {
                setResponse(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Seja específico e construtivo. Use exemplos quando possível."
              className="min-h-[160px]"
              maxLength={5000}
            />
            <div className="flex items-center justify-between text-xs">
              <span className={error ? "text-destructive" : "text-muted-foreground"}>
                {error ?? "Mínimo 50 caracteres."}
              </span>
              <span className="text-muted-foreground">{charCount}/5000</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!valid || respond.isPending} className="gap-1.5">
            {respond.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Enviar resposta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
