-- Enum for announcement types
CREATE TYPE public.announcement_type AS ENUM ('event', 'info', 'urgent', 'celebration');

-- Enum for automation types
CREATE TYPE public.automation_type AS ENUM ('birthday', 'anniversary', 'new_hire', 'reminder');

-- Enum for automation log status
CREATE TYPE public.automation_log_status AS ENUM ('success', 'failed', 'pending');

-- Add birth_date column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Create announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type announcement_type NOT NULL DEFAULT 'info',
  target_audience TEXT[] DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  slack_channel_id TEXT,
  slack_sent_at TIMESTAMPTZ,
  post_to_feed BOOLEAN NOT NULL DEFAULT false,
  feed_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create automations table
CREATE TABLE public.automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type automation_type NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create automation_logs table
CREATE TABLE public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  message_sent TEXT,
  slack_response JSONB,
  status automation_log_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- Add triggers for updated_at
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_automations_updated_at
  BEFORE UPDATE ON public.automations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies for announcements
CREATE POLICY "Members can view company announcements"
  ON public.announcements FOR SELECT
  USING (is_company_member(auth.uid(), company_id));

CREATE POLICY "Admins can create announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Author or admins can update announcements"
  ON public.announcements FOR UPDATE
  USING (author_id = auth.uid() OR is_company_admin(auth.uid(), company_id));

CREATE POLICY "Author or admins can delete announcements"
  ON public.announcements FOR DELETE
  USING (author_id = auth.uid() OR is_company_admin(auth.uid(), company_id));

-- RLS Policies for automations
CREATE POLICY "Admins can view automations"
  ON public.automations FOR SELECT
  USING (is_company_admin(auth.uid(), company_id));

CREATE POLICY "Admins can manage automations"
  ON public.automations FOR ALL
  USING (is_company_admin(auth.uid(), company_id));

-- RLS Policies for automation_logs
CREATE POLICY "Admins can view automation logs"
  ON public.automation_logs FOR SELECT
  USING (is_company_admin(auth.uid(), company_id));

-- Create indexes for performance
CREATE INDEX idx_announcements_company_id ON public.announcements(company_id);
CREATE INDEX idx_announcements_scheduled_at ON public.announcements(scheduled_at);
CREATE INDEX idx_automations_company_id ON public.automations(company_id);
CREATE INDEX idx_automations_type ON public.automations(type);
CREATE INDEX idx_automation_logs_automation_id ON public.automation_logs(automation_id);
CREATE INDEX idx_automation_logs_created_at ON public.automation_logs(created_at);