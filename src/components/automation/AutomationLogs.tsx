import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, XCircle, Clock, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type LogStatus = "success" | "failed" | "pending";

const statusConfig: Record<
  LogStatus,
  { icon: typeof CheckCircle2; color: string; label: string }
> = {
  success: { icon: CheckCircle2, color: "text-green-500", label: "Sucesso" },
  failed: { icon: XCircle, color: "text-destructive", label: "Falhou" },
  pending: { icon: Clock, color: "text-yellow-500", label: "Pendente" },
};

export function AutomationLogs() {
  const { profile } = useUser();

  const { data: logs, isLoading } = useQuery({
    queryKey: ["automation-logs", profile?.primary_company_id],
    queryFn: async () => {
      if (!profile?.primary_company_id) return [];

      const { data, error } = await supabase
        .from("automation_logs")
        .select(
          `
          *,
          automation:automations(name, type),
          target_user:users!automation_logs_target_user_id_fkey(full_name, avatar_url)
        `
        )
        .eq("company_id", profile.primary_company_id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.primary_company_id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!logs?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-4">📋</div>
        <h3 className="text-lg font-semibold text-foreground">
          Nenhum log encontrado
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Os logs de automação aparecerão aqui quando forem executados
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const config = statusConfig[log.status as LogStatus];
        const StatusIcon = config.icon;

        return (
          <div
            key={log.id}
            className="flex items-start gap-4 rounded-lg border bg-card p-4"
          >
            <StatusIcon className={cn("h-5 w-5 mt-0.5", config.color)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground">
                  {log.automation?.name || log.event_type}
                </span>
                <Badge variant="outline" className="text-xs">
                  {config.label}
                </Badge>
              </div>
              {log.target_user && (
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{log.target_user.full_name}</span>
                </div>
              )}
              {log.message_sent && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {log.message_sent}
                </p>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
