import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Settings, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { usePipefySync } from "@/hooks/usePipefySync";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PipefySyncCardProps {
  onConfigure: () => void;
}

export function PipefySyncCard({ onConfigure }: PipefySyncCardProps) {
  const { syncConfig, isConfigured, runSync, isSyncing } = usePipefySync();
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncError(null);
    try {
      await runSync();
    } catch (error: any) {
      setSyncError(error.message);
    }
  };

  const getStatusBadge = () => {
    if (!isConfigured) {
      return <Badge variant="secondary">Não configurado</Badge>;
    }
    
    switch (syncConfig?.sync_status) {
      case "success":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Sincronizado
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Erro
          </Badge>
        );
      case "running":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Sincronizando
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Nunca sincronizado
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Sincronização Pipefy
              {getStatusBadge()}
            </CardTitle>
            <CardDescription>
              {isConfigured
                ? syncConfig?.last_sync_at
                  ? `Última sincronização: ${formatDistanceToNow(new Date(syncConfig.last_sync_at), { addSuffix: true, locale: ptBR })}`
                  : "Configurado, aguardando primeira sincronização"
                : "Configure a integração para sincronizar colaboradores"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {syncError && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{syncError}</p>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onConfigure}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          
          {isConfigured && (
            <Button
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
