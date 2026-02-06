import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { toast } from "sonner";

export interface PipefySyncConfig {
  id: string;
  company_id: string;
  table_id: string;
  organization_id: string | null;
  field_mapping: Record<string, string>;
  last_sync_at: string | null;
  sync_status: string;
  created_at: string;
  updated_at: string;
}

export interface PipefySyncLog {
  id: string;
  company_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  records_synced: number;
  records_created: number;
  records_updated: number;
  records_skipped: number;
  error_message: string | null;
  details: Record<string, unknown>;
}

export interface PipefyTable {
  id: string;
  name: string;
  description: string | null;
  table_fields: Array<{
    id: string;
    label: string;
    type: string;
    required: boolean;
  }>;
}

export interface PipefyOrganization {
  id: string;
  name: string;
}

export function usePipefySync() {
  const { profile } = useUser();
  const queryClient = useQueryClient();
  const companyId = profile?.primary_company_id;

  // Get sync config for current company
  const { data: syncConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ["pipefy-sync-config", companyId],
    queryFn: async () => {
      if (!companyId) return null;

      const { data, error } = await supabase
        .from("pipefy_sync_config")
        .select("*")
        .eq("company_id", companyId)
        .maybeSingle();

      if (error) throw error;
      return data as PipefySyncConfig | null;
    },
    enabled: !!companyId,
  });

  // Get sync logs
  const { data: syncLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["pipefy-sync-logs", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("pipefy_sync_logs")
        .select("*")
        .eq("company_id", companyId)
        .order("started_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as PipefySyncLog[];
    },
    enabled: !!companyId,
  });

  // Fetch Pipefy tables
  const fetchTablesMutation = useMutation({
    mutationFn: async (organizationId?: string) => {
      const { data, error } = await supabase.functions.invoke("pipefy-tables", {
        body: { organizationId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data as {
        organizations: PipefyOrganization[];
        currentOrganization?: { id: string; name: string };
        tables: PipefyTable[];
      };
    },
    onError: (error) => {
      toast.error("Erro ao buscar tabelas do Pipefy: " + error.message);
    },
  });

  // Save sync config
  const saveConfigMutation = useMutation({
    mutationFn: async (config: {
      tableId: string;
      organizationId: string;
      fieldMapping: Record<string, string>;
    }) => {
      if (!companyId) throw new Error("Empresa não encontrada");

      const { data: existing } = await supabase
        .from("pipefy_sync_config")
        .select("id")
        .eq("company_id", companyId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("pipefy_sync_config")
          .update({
            table_id: config.tableId,
            organization_id: config.organizationId,
            field_mapping: config.fieldMapping,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("pipefy_sync_config")
          .insert({
            company_id: companyId,
            table_id: config.tableId,
            organization_id: config.organizationId,
            field_mapping: config.fieldMapping,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipefy-sync-config"] });
      toast.success("Configuração salva com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar configuração: " + error.message);
    },
  });

  // Run sync
  const runSyncMutation = useMutation({
    mutationFn: async () => {
      if (!companyId || !syncConfig) {
        throw new Error("Configuração não encontrada");
      }

      const { data, error } = await supabase.functions.invoke("pipefy-sync", {
        body: {
          companyId: companyId,
          tableId: syncConfig.table_id,
          fieldMapping: syncConfig.field_mapping,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pipefy-sync-config"] });
      queryClient.invalidateQueries({ queryKey: ["pipefy-sync-logs"] });
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      toast.success(
        `Sincronização concluída! ${data.recordsCreated} criados, ${data.recordsUpdated} atualizados.`
      );
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["pipefy-sync-logs"] });
      toast.error("Erro na sincronização: " + error.message);
    },
  });

  return {
    syncConfig,
    syncLogs,
    isLoadingConfig,
    isLoadingLogs,
    isConfigured: !!syncConfig?.table_id,
    fetchTables: fetchTablesMutation.mutateAsync,
    isFetchingTables: fetchTablesMutation.isPending,
    saveConfig: saveConfigMutation.mutateAsync,
    isSavingConfig: saveConfigMutation.isPending,
    runSync: runSyncMutation.mutateAsync,
    isSyncing: runSyncMutation.isPending,
  };
}
