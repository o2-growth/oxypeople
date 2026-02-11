import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Cake } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BirthdayPerson {
  id: string;
  full_name: string;
  avatar_url: string | null;
  birth_date: string;
  daysUntil: number;
}

function useUpcomingBirthdays(limit = 5) {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["upcoming-birthdays", companyId],
    queryFn: async (): Promise<BirthdayPerson[]> => {
      if (!companyId) return [];

      const { data: members } = await supabase
        .from("company_memberships")
        .select("user_id")
        .eq("company_id", companyId)
        .eq("status", "active");

      if (!members || members.length === 0) return [];

      const userIds = members.map((m) => m.user_id);
      const { data: users } = await supabase
        .from("users")
        .select("id, full_name, avatar_url, birth_date")
        .in("id", userIds)
        .not("birth_date", "is", null);

      if (!users) return [];

      const today = new Date();
      const endWindow = addDays(today, 30);

      const upcoming: BirthdayPerson[] = [];

      users.forEach((u) => {
        if (!u.birth_date) return;
        const bd = parseISO(u.birth_date);
        // Set birthday to this year
        const thisYearBd = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
        let target = thisYearBd;
        if (isBefore(thisYearBd, today)) {
          // Already passed, check next year
          target = new Date(today.getFullYear() + 1, bd.getMonth(), bd.getDate());
        }
        
        const diffMs = target.getTime() - today.getTime();
        const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysUntil <= 30) {
          upcoming.push({
            id: u.id,
            full_name: u.full_name || "Sem nome",
            avatar_url: u.avatar_url,
            birth_date: u.birth_date,
            daysUntil,
          });
        }
      });

      return upcoming.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, limit);
    },
    enabled: !!companyId,
  });
}

export function BirthdaysWidget() {
  const { data: birthdays, isLoading } = useUpcomingBirthdays();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Cake className="h-4 w-4 text-warning" />
        Aniversariantes
      </h3>
      {isLoading ? (
        <div className="text-xs text-muted-foreground">Carregando...</div>
      ) : birthdays && birthdays.length > 0 ? (
        <div className="space-y-2">
          {birthdays.map((person) => {
            const initials = person.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2);
            return (
              <div key={person.id} className="flex items-center gap-3">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={person.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{person.full_name}</p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {person.daysUntil === 0 ? "🎂 Hoje!" : `em ${person.daysUntil}d`}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Nenhum nos próximos 30 dias</p>
      )}
    </div>
  );
}
