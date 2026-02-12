import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { History, Plus, Pencil, Trash2 } from "lucide-react";
import { useAuditLog } from "@/hooks/useCheckins";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const actionIcons: Record<string, typeof Plus> = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
};

const actionLabels: Record<string, string> = {
  created: "Criou",
  updated: "Alterou",
  deleted: "Excluiu",
};

const entityLabels: Record<string, string> = {
  objective: "Objetivo",
  key_result: "Key Result",
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

export function AuditLogDialog({ open, onOpenChange }: AuditLogDialogProps) {
  // Fetch all logs (no entityId filter)
  const { data: logs = [], isLoading } = useAuditLog();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Histórico de Auditoria
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[450px]">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum registro de auditoria.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log: any) => {
                const Icon = actionIcons[log.action] || Pencil;
                const user = log.changed_by_user;
                const field = log.field_changed
                  ? fieldLabels[log.field_changed] || log.field_changed
                  : null;

                return (
                  <div key={log.id} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                    <div className="shrink-0 mt-0.5 p-1.5 rounded bg-muted">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {user && (
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={user.avatar_url || ""} />
                            <AvatarFallback className="text-[7px]">
                              {(user.full_name || user.email).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <span className="text-xs font-medium">
                          {user?.full_name || user?.email || "Sistema"}
                        </span>
                        <Badge variant="outline" className="text-[9px] h-4">
                          {entityLabels[log.entity_type] || log.entity_type}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(log.created_at), "dd MMM HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.action === "created" && (
                          <>
                            {actionLabels.created}:{" "}
                            <span className="font-medium text-foreground">{log.new_value}</span>
                          </>
                        )}
                        {log.action === "updated" && field && (
                          <>
                            {actionLabels.updated} {field}:{" "}
                            <span className="line-through">{log.old_value}</span> →{" "}
                            <span className="font-medium text-foreground">{log.new_value}</span>
                          </>
                        )}
                        {log.action === "deleted" && (
                          <>
                            {actionLabels.deleted}:{" "}
                            <span className="line-through">{log.old_value}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
