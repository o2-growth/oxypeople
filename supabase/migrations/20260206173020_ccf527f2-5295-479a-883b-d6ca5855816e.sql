-- Tabela de configuração de sincronização Pipefy
CREATE TABLE public.pipefy_sync_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  table_id text NOT NULL,
  organization_id text,
  field_mapping jsonb NOT NULL DEFAULT '{}',
  last_sync_at timestamptz,
  sync_status text DEFAULT 'never',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id)
);

-- Tabela de logs de sincronização
CREATE TABLE public.pipefy_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  records_synced integer DEFAULT 0,
  records_created integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_skipped integer DEFAULT 0,
  error_message text,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pipefy_sync_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipefy_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies para pipefy_sync_config
CREATE POLICY "Admins can manage sync config"
  ON public.pipefy_sync_config
  FOR ALL
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Admins can view sync config"
  ON public.pipefy_sync_config
  FOR SELECT
  USING (is_company_admin(auth.uid(), company_id));

-- RLS Policies para pipefy_sync_logs
CREATE POLICY "Admins can view sync logs"
  ON public.pipefy_sync_logs
  FOR SELECT
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Admins can insert sync logs"
  ON public.pipefy_sync_logs
  FOR INSERT
  WITH CHECK (is_company_admin(auth.uid(), company_id));

-- Índices para performance
CREATE INDEX idx_pipefy_sync_logs_company ON public.pipefy_sync_logs(company_id);
CREATE INDEX idx_pipefy_sync_logs_status ON public.pipefy_sync_logs(status);
CREATE INDEX idx_pipefy_sync_logs_started_at ON public.pipefy_sync_logs(started_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_pipefy_sync_config_updated_at
  BEFORE UPDATE ON public.pipefy_sync_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();