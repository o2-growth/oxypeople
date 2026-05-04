import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EyeOff } from "lucide-react";

interface PulseCommentsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodStart: string | null;
  comments: Array<{
    id: string;
    period_start: string;
    score: number;
    comment: string;
    author: { id: string; full_name: string | null; avatar_url: string | null } | null;
  }>;
  anonymous: boolean;
}

function initialsOf(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function PulseCommentsDrawer({
  open,
  onOpenChange,
  periodStart,
  comments,
  anonymous,
}: PulseCommentsDrawerProps) {
  const filtered = periodStart
    ? comments.filter((c) => c.period_start === periodStart)
    : comments;

  const periodLabel = periodStart
    ? (() => {
        try {
          return format(parseISO(periodStart), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
        } catch {
          return periodStart;
        }
      })()
    : "Todos os períodos";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Comentários — {periodLabel}</SheetTitle>
          <SheetDescription>
            {anonymous
              ? "Pesquisa anônima — autores não exibidos."
              : "Comentários atrelados às respostas."}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum comentário neste período.
            </p>
          ) : (
            filtered.map((c) => (
              <div key={c.id} className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  {anonymous ? (
                    <Badge variant="secondary" className="gap-1 font-normal">
                      <EyeOff className="h-3 w-3" />
                      Anônimo
                    </Badge>
                  ) : c.author ? (
                    <span className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={c.author.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                          {initialsOf(c.author.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{c.author.full_name || "Sem nome"}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sem autor</span>
                  )}
                  <Badge variant="outline" className="font-mono">
                    {c.score}
                  </Badge>
                </div>
                <p className="text-sm whitespace-pre-line leading-snug">{c.comment}</p>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
