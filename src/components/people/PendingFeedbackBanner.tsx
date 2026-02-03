import { useState } from "react";
import { useMyPendingFeedback } from "@/hooks/useOnboardingFeedback";
import { FeedbackFormDialog } from "./FeedbackFormDialog";
import { Button } from "@/components/ui/button";
import { ClipboardList, X, Clock } from "lucide-react";
import { differenceInDays } from "date-fns";

export function PendingFeedbackBanner() {
  const { data: pendingFeedback, isLoading } = useMyPendingFeedback();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isLoading || !pendingFeedback || isDismissed) {
    return null;
  }

  const daysRemaining = differenceInDays(
    new Date(pendingFeedback.due_date),
    new Date()
  );

  const isUrgent = daysRemaining <= 5;

  return (
    <>
      <div
        className={`
          px-4 py-3 
          ${isUrgent ? "bg-destructive/10 border-b border-destructive/20" : "bg-primary/10 border-b border-primary/20"}
        `}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`
                p-2 rounded-lg 
                ${isUrgent ? "bg-destructive/20" : "bg-primary/20"}
              `}
            >
              <ClipboardList
                className={`h-5 w-5 ${isUrgent ? "text-destructive" : "text-primary"}`}
              />
            </div>
            <div>
              <p className="font-medium text-sm">
                Você tem um feedback de integração pendente
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {daysRemaining > 0
                  ? `${daysRemaining} dias restantes para responder`
                  : daysRemaining === 0
                  ? "Último dia para responder!"
                  : "Prazo expirado"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className={isUrgent ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              Preencher Agora
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setIsDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <FeedbackFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        dueDate={pendingFeedback.due_date}
      />
    </>
  );
}
