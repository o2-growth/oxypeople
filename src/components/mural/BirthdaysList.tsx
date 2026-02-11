import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Cake } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import type { HREvent } from "@/hooks/useHRCalendar";

interface BirthdaysListProps {
  birthdays: HREvent[];
  isLoading: boolean;
}

export function BirthdaysList({ birthdays, isLoading }: BirthdaysListProps) {
  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-5 w-40" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Cake className="h-4 w-4 text-pink-500" />
          <h3 className="text-sm font-semibold">Aniversariantes do Mês</h3>
        </div>
        {birthdays.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum aniversariante este mês 🎂</p>
        ) : (
          <div className="space-y-2.5">
            {birthdays.map((b) => (
              <div key={b.id} className="flex items-center gap-2.5">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={b.avatarUrl || undefined} />
                  <AvatarFallback className="bg-pink-100 text-pink-600 text-xs">
                    {getInitials(b.userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{b.userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(b.date, "dd 'de' MMM", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
