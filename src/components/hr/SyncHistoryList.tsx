import { usePipefySync } from "@/hooks/usePipefySync";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function SyncHistoryList() {
  const { syncLogs, isLoadingLogs } = usePipefySync();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Sucesso</Badge>;
      case "error":
        return <Badge variant="destructive">Erro</Badge>;
      case "running":
        return <Badge className="bg-blue-100 text-blue-800">Em andamento</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoadingLogs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Sincronizações</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Histórico de Sincronizações</CardTitle>
        <CardDescription>
          Últimas 20 sincronizações realizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!syncLogs || syncLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma sincronização realizada ainda
          </p>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {syncLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-0.5">{getStatusIcon(log.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(log.status)}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.started_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <p className="text-sm">
                      {log.status === "success" ? (
                        <>
                          <span className="font-medium">{log.records_synced}</span> registros processados
                          {log.records_created > 0 && (
                            <span className="text-green-600"> (+{log.records_created} novos)</span>
                          )}
                          {log.records_updated > 0 && (
                            <span className="text-blue-600"> ({log.records_updated} atualizados)</span>
                          )}
                        </>
                      ) : log.status === "error" ? (
                        <span className="text-red-600">{log.error_message || "Erro desconhecido"}</span>
                      ) : (
                        "Sincronização em andamento..."
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(log.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
