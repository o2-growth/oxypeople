import { useState } from "react";
import { format, formatDistanceToNow, isBefore, isAfter, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { FeedbackVisibilityBadge } from "./FeedbackVisibilityBadge";
import type { FeedbackInboxRow } from "@/hooks/useFeedbackInbox";

interface FeedbackInboxItemProps {
  item: FeedbackInboxRow;
  onRespond: () => void;
  onDecline: () => void;
}

function initialsOf(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function dueDateBadge(due: string | null): { className: string; label: string } | null {
  if (!due) return null;
  const dueDate = parseISO(due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isBefore(dueDate, today)) {
    return {
      className: "border-destructive text-destructive",
      label: `Atrasado · ${format(dueDate, "dd MMM", { locale: ptBR })}`,
    };
  }
  if (isAfter(dueDate, addDays(today, 3))) {
    return {
      className: "border-emerald-500 text-emerald-600",
      label: `Prazo · ${format(dueDate, "dd MMM", { locale: ptBR })}`,
    };
  }
  return {
    className: "border-amber-500 text-amber-600",
    label: `Prazo · ${format(dueDate, "dd MMM", { locale: ptBR })}`,
  };
}

export function FeedbackInboxItem({ item, onRespond, onDecline }: FeedbackInboxItemProps) {
  const [expanded, setExpanded] = useState(false);
  const dueBadge = dueDateBadge(item.due_date);
  const isLong = item.question.length > 200;
  const truncated = isLong && !expanded ? `${item.question.slice(0, 200)}...` : item.question;

  return (
    <Card className="border-border/60">
      <CardContent className="space-y-3 py-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={item.requester?.avatar_url ?? undefined} />
            <AvatarFallback>{initialsOf(item.requester?.full_name ?? null)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-medium">
                {item.requester?.full_name || "Alguém"}
              </span>
              <span className="text-xs text-muted-foreground">
                pediu feedback sobre{" "}
                <strong className="text-foreground/80">
                  {item.subject?.full_name || "alguém"}
                </strong>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(parseISO(item.created_at), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            <FeedbackVisibilityBadge visibility={item.visibility} />
            {dueBadge && (
              <Badge variant="outline" className={cn("gap-1 font-normal", dueBadge.className)}>
                <Clock className="h-3 w-3" />
                {dueBadge.label}
              </Badge>
            )}
          </div>
        </div>

        <div className="rounded-md bg-muted/40 p-3">
          <p className="text-sm leading-snug whitespace-pre-line">{truncated}</p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Mostrar menos" : "Ver mais"}
            </button>
          )}
        </div>

        {item.competency_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.competency_tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {item.status === "answered" ? (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
            <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Resposta enviada
              {item.answered_at && (
                <span className="text-muted-foreground font-normal">
                  · {format(parseISO(item.answered_at), "dd MMM 'às' HH:mm", { locale: ptBR })}
                </span>
              )}
            </p>
            {item.response && (
              <p className="text-sm leading-snug whitespace-pre-line">{item.response}</p>
            )}
          </div>
        ) : item.status === "declined" ? (
          <div className="rounded-md border border-muted-foreground/30 bg-muted/40 p-3">
            <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <XCircle className="h-3.5 w-3.5" />
              Pedido recusado
            </p>
            {item.declined_reason && (
              <p className="text-sm text-muted-foreground italic">{item.declined_reason}</p>
            )}
          </div>
        ) : (
          <div className="flex justify-end gap-2 border-t pt-3">
            <Button variant="ghost" size="sm" onClick={onDecline}>
              Recusar
            </Button>
            <Button size="sm" onClick={onRespond}>
              Responder
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
