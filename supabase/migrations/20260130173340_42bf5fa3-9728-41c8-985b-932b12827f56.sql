-- =============================================
-- PEOPLE HUB - COMPLETE DATABASE SCHEMA
-- =============================================

-- Create custom types/enums
CREATE TYPE public.membership_role AS ENUM ('owner', 'admin', 'manager', 'member');
CREATE TYPE public.membership_status AS ENUM ('active', 'invited', 'pending', 'inactive');
CREATE TYPE public.post_visibility AS ENUM ('public', 'company', 'private');
CREATE TYPE public.objective_status AS ENUM ('on-track', 'at-risk', 'off-track', 'completed');
CREATE TYPE public.survey_status AS ENUM ('draft', 'scheduled', 'active', 'completed');
CREATE TYPE public.question_type AS ENUM ('text', 'rating', 'multiple_choice', 'single_choice', 'scale');

-- =============================================
-- 1. USERS TABLE (mirrors auth.users)
-- =============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'pt-BR',
  last_active_at TIMESTAMPTZ,
  primary_company_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_primary_company ON public.users(primary_company_id);
CREATE INDEX idx_users_last_active ON public.users(last_active_at);

-- =============================================
-- 2. COMPANIES TABLE
-- =============================================
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  logo_url TEXT,
  plan TEXT DEFAULT 'free',
  billing_customer_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_companies_owner ON public.companies(owner_id);

-- Add FK constraint for users.primary_company_id after companies table exists
ALTER TABLE public.users 
ADD CONSTRAINT fk_users_primary_company 
FOREIGN KEY (primary_company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

-- =============================================
-- 3. USER ROLES TABLE (for RLS - separate from membership)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role membership_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_company ON public.user_roles(company_id);

-- =============================================
-- 4. COMPANY MEMBERSHIPS TABLE
-- =============================================
CREATE TABLE public.company_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status membership_status NOT NULL DEFAULT 'invited',
  department TEXT,
  position TEXT,
  joined_at TIMESTAMPTZ,
  invited_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

CREATE INDEX idx_memberships_company ON public.company_memberships(company_id);
CREATE INDEX idx_memberships_user ON public.company_memberships(user_id);
CREATE INDEX idx_memberships_status ON public.company_memberships(status);

-- =============================================
-- 5. INVITES TABLE
-- =============================================
CREATE TABLE public.invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  role membership_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES public.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invites_company ON public.invites(company_id);
CREATE INDEX idx_invites_email ON public.invites(email);
CREATE INDEX idx_invites_token ON public.invites(token);

-- =============================================
-- 6. POSTS TABLE (Social Feed)
-- =============================================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  visibility post_visibility NOT NULL DEFAULT 'company',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_company ON public.posts(company_id, created_at DESC);
CREATE INDEX idx_posts_author ON public.posts(author_id);

-- =============================================
-- 7. COMMENTS TABLE
-- =============================================
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comments_post ON public.comments(post_id, created_at DESC);
CREATE INDEX idx_comments_author ON public.comments(author_id);

-- =============================================
-- 8. REACTIONS TABLE
-- =============================================
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT reaction_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  ),
  UNIQUE(user_id, post_id, comment_id, type)
);

CREATE INDEX idx_reactions_post ON public.reactions(post_id);
CREATE INDEX idx_reactions_comment ON public.reactions(comment_id);
CREATE INDEX idx_reactions_user ON public.reactions(user_id);

-- =============================================
-- 9. BADGES TABLE
-- =============================================
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  emoji TEXT,
  color TEXT DEFAULT '#10b981',
  points INTEGER NOT NULL DEFAULT 10,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_badges_company ON public.badges(company_id);

-- =============================================
-- 10. RECOGNITIONS TABLE
-- =============================================
CREATE TABLE public.recognitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES public.badges(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recognitions_company ON public.recognitions(company_id, created_at DESC);
CREATE INDEX idx_recognitions_from ON public.recognitions(from_user_id);
CREATE INDEX idx_recognitions_to ON public.recognitions(to_user_id);

-- =============================================
-- 11. OBJECTIVES TABLE (OKRs)
-- =============================================
CREATE TABLE public.objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.objectives(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status objective_status NOT NULL DEFAULT 'on-track',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  visibility post_visibility NOT NULL DEFAULT 'company',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_objectives_company ON public.objectives(company_id);
CREATE INDEX idx_objectives_owner ON public.objectives(owner_id);
CREATE INDEX idx_objectives_parent ON public.objectives(parent_id);

-- =============================================
-- 12. KEY RESULTS TABLE
-- =============================================
CREATE TABLE public.key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES public.objectives(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_value NUMERIC NOT NULL DEFAULT 100,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT '%',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_key_results_objective ON public.key_results(objective_id);

-- =============================================
-- 13. SURVEYS TABLE
-- =============================================
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status survey_status NOT NULL DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_surveys_company ON public.surveys(company_id);
CREATE INDEX idx_surveys_status ON public.surveys(status);

-- =============================================
-- 14. SURVEY QUESTIONS TABLE
-- =============================================
CREATE TABLE public.survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL DEFAULT 'text',
  options JSONB DEFAULT '[]',
  order_index INTEGER NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_survey_questions_survey ON public.survey_questions(survey_id, order_index);

-- =============================================
-- 15. SURVEY RESPONSES TABLE
-- =============================================
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- null for anonymous
  answer JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_survey_responses_survey ON public.survey_responses(survey_id);
CREATE INDEX idx_survey_responses_question ON public.survey_responses(question_id);
CREATE INDEX idx_survey_responses_user ON public.survey_responses(user_id);

-- =============================================
-- HELPER FUNCTION: Check user role in company
-- =============================================
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID, p_company_id UUID)
RETURNS membership_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = p_user_id AND company_id = p_company_id
  LIMIT 1
$$;

-- =============================================
-- HELPER FUNCTION: Check if user is company member
-- =============================================
CREATE OR REPLACE FUNCTION public.is_company_member(p_user_id UUID, p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_memberships
    WHERE user_id = p_user_id 
    AND company_id = p_company_id 
    AND status = 'active'
  )
$$;

-- =============================================
-- HELPER FUNCTION: Check if user is admin/owner
-- =============================================
CREATE OR REPLACE FUNCTION public.is_company_admin(p_user_id UUID, p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id 
    AND company_id = p_company_id 
    AND role IN ('owner', 'admin')
  )
$$;

-- =============================================
-- TRIGGER: Auto-create user profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TRIGGER: Update updated_at timestamp
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON public.company_memberships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_badges_updated_at BEFORE UPDATE ON public.badges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_objectives_updated_at BEFORE UPDATE ON public.objectives FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_key_results_updated_at BEFORE UPDATE ON public.key_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_surveys_updated_at BEFORE UPDATE ON public.surveys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recognitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES: Users
-- =============================================
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view profiles of same company members" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.company_memberships cm1
      JOIN public.company_memberships cm2 ON cm1.company_id = cm2.company_id
      WHERE cm1.user_id = auth.uid() 
      AND cm2.user_id = users.id
      AND cm1.status = 'active'
    )
  );

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- RLS POLICIES: Companies
-- =============================================
CREATE POLICY "Members can view their companies" ON public.companies
  FOR SELECT USING (public.is_company_member(auth.uid(), id));

CREATE POLICY "Authenticated users can create companies" ON public.companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update company" ON public.companies
  FOR UPDATE USING (public.is_company_admin(auth.uid(), id));

-- =============================================
-- RLS POLICIES: User Roles
-- =============================================
CREATE POLICY "Members can view roles in their company" ON public.user_roles
  FOR SELECT USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.is_company_admin(auth.uid(), company_id));

-- =============================================
-- RLS POLICIES: Company Memberships
-- =============================================
CREATE POLICY "Members can view memberships in their company" ON public.company_memberships
  FOR SELECT USING (public.is_company_member(auth.uid(), company_id) OR user_id = auth.uid());

CREATE POLICY "Admins can manage memberships" ON public.company_memberships
  FOR ALL USING (public.is_company_admin(auth.uid(), company_id));

CREATE POLICY "Users can accept their own invite" ON public.company_memberships
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =============================================
-- RLS POLICIES: Invites
-- =============================================
CREATE POLICY "Admins can view company invites" ON public.invites
  FOR SELECT USING (public.is_company_admin(auth.uid(), company_id));

CREATE POLICY "Invitees can view their invite by token" ON public.invites
  FOR SELECT USING (
    email = (SELECT email FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins can create invites" ON public.invites
  FOR INSERT WITH CHECK (public.is_company_admin(auth.uid(), company_id));

CREATE POLICY "Admins can delete invites" ON public.invites
  FOR DELETE USING (public.is_company_admin(auth.uid(), company_id));

-- =============================================
-- RLS POLICIES: Posts
-- =============================================
CREATE POLICY "Members can view company posts" ON public.posts
  FOR SELECT USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Members can create posts" ON public.posts
  FOR INSERT WITH CHECK (
    author_id = auth.uid() AND 
    public.is_company_member(auth.uid(), company_id)
  );

CREATE POLICY "Authors can update own posts" ON public.posts
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Authors can delete own posts" ON public.posts
  FOR DELETE USING (author_id = auth.uid());

-- =============================================
-- RLS POLICIES: Comments
-- =============================================
CREATE POLICY "Members can view comments on company posts" ON public.comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts p 
      WHERE p.id = comments.post_id 
      AND public.is_company_member(auth.uid(), p.company_id)
    )
  );

CREATE POLICY "Members can create comments" ON public.comments
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Authors can update own comments" ON public.comments
  FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Authors can delete own comments" ON public.comments
  FOR DELETE USING (author_id = auth.uid());

-- =============================================
-- RLS POLICIES: Reactions
-- =============================================
CREATE POLICY "Anyone can view reactions" ON public.reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can create reactions" ON public.reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own reactions" ON public.reactions
  FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- RLS POLICIES: Badges
-- =============================================
CREATE POLICY "Members can view company badges" ON public.badges
  FOR SELECT USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Admins can manage badges" ON public.badges
  FOR ALL USING (public.is_company_admin(auth.uid(), company_id));

-- =============================================
-- RLS POLICIES: Recognitions
-- =============================================
CREATE POLICY "Members can view company recognitions" ON public.recognitions
  FOR SELECT USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Members can create recognitions" ON public.recognitions
  FOR INSERT WITH CHECK (
    from_user_id = auth.uid() AND 
    public.is_company_member(auth.uid(), company_id)
  );

-- =============================================
-- RLS POLICIES: Objectives
-- =============================================
CREATE POLICY "Members can view company objectives" ON public.objectives
  FOR SELECT USING (
    public.is_company_member(auth.uid(), company_id) AND
    (visibility != 'private' OR owner_id = auth.uid())
  );

CREATE POLICY "Members can create objectives" ON public.objectives
  FOR INSERT WITH CHECK (
    owner_id = auth.uid() AND 
    public.is_company_member(auth.uid(), company_id)
  );

CREATE POLICY "Owners can update objectives" ON public.objectives
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete objectives" ON public.objectives
  FOR DELETE USING (owner_id = auth.uid());

-- =============================================
-- RLS POLICIES: Key Results
-- =============================================
CREATE POLICY "Users can view key results of visible objectives" ON public.key_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.objectives o 
      WHERE o.id = key_results.objective_id 
      AND public.is_company_member(auth.uid(), o.company_id)
      AND (o.visibility != 'private' OR o.owner_id = auth.uid())
    )
  );

CREATE POLICY "Objective owners can manage key results" ON public.key_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.objectives o 
      WHERE o.id = key_results.objective_id 
      AND o.owner_id = auth.uid()
    )
  );

-- =============================================
-- RLS POLICIES: Surveys
-- =============================================
CREATE POLICY "Members can view company surveys" ON public.surveys
  FOR SELECT USING (public.is_company_member(auth.uid(), company_id));

CREATE POLICY "Admins can manage surveys" ON public.surveys
  FOR ALL USING (public.is_company_admin(auth.uid(), company_id));

-- =============================================
-- RLS POLICIES: Survey Questions
-- =============================================
CREATE POLICY "Members can view survey questions" ON public.survey_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.surveys s 
      WHERE s.id = survey_questions.survey_id 
      AND public.is_company_member(auth.uid(), s.company_id)
    )
  );

CREATE POLICY "Admins can manage survey questions" ON public.survey_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.surveys s 
      WHERE s.id = survey_questions.survey_id 
      AND public.is_company_admin(auth.uid(), s.company_id)
    )
  );

-- =============================================
-- RLS POLICIES: Survey Responses
-- =============================================
CREATE POLICY "Users can view own responses" ON public.survey_responses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all responses (aggregated)" ON public.survey_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.surveys s 
      WHERE s.id = survey_responses.survey_id 
      AND public.is_company_admin(auth.uid(), s.company_id)
    )
  );

CREATE POLICY "Members can submit responses" ON public.survey_responses
  FOR INSERT WITH CHECK (
    (user_id = auth.uid() OR user_id IS NULL) AND
    EXISTS (
      SELECT 1 FROM public.surveys s 
      WHERE s.id = survey_responses.survey_id 
      AND public.is_company_member(auth.uid(), s.company_id)
      AND s.status = 'active'
    )
  );