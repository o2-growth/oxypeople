-- Tabela de notificações
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'recognition', 'mention', 'comment', 'survey', 'announcement', 'objective_deadline'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID, -- ID do item relacionado (post, recognition, survey, etc)
  reference_type TEXT, -- 'post', 'recognition', 'survey', 'announcement', 'objective'
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index para busca rápida por usuário e status de leitura
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (is_company_member(auth.uid(), company_id) OR is_company_admin(auth.uid(), company_id));

CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (user_id = auth.uid());

-- Habilitar realtime para notificações
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;