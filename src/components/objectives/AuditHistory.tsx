import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Plus, Pencil, Trash2 } from "lucide-react";
import { useAuditLog } from "@/hooks/useCheckins";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditHistoryProps {
  entityId: string;
}

const actionIcons: Record<string, typeof Plus> = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
};

const fieldLabels: Record<string, string> = {
  title: "Título",
  owner_id: "Responsável",
  status: "Status",
  parent_id: "Objetivo pai",
  target_value: "Meta",
  weight_percentage: "Peso",
  owner_user_id: "Dono do KR",
};

export function AuditHistory({ entityId }: AuditHistoryProps) {
  const { data: logs = [], isLoading } = useAuditLog(entityId);

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Carregando...</p>;
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-4">
        <History className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">Nenhum registro.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-64">
      <div className="space-y-2">
        {logs.map((log: any) => {
          const Icon = actionIcons[log.action] || Pencil;
          const user = log.changed_by_user;
          const field = log.field_changed ? (fieldLabels[log.field_changed] || log.field_changed) : null;

          return (
            <div key={log.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
              <div className="shrink-0 mt-0.5 p-1 rounded bg-muted">
                <Icon className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {user && (
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={user.avatar_url || ""} />
                      <AvatarFallback className="text-[7px]">
                        {(user.full_name || user.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span className="text-[10px] font-medium">
                    {user?.full_name || user?.email || "Sistema"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(log.created_at), "dd MMM HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {log.action === "created" && (
                    <>Criou: <span className="font-medium text-foreground">{log.new_value}</span></>
                  )}
                  {log.action === "updated" && field && (
                    <>Alterou {field}: <span className="line-through">{log.old_value}</span> → <span className="font-medium text-foreground">{log.new_value}</span></>
                  )}
                  {log.action === "deleted" && (
                    <>Excluiu: <span className="line-through">{log.old_value}</span></>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
