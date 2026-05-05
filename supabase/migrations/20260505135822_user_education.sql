-- =============================================================================
-- User Education — academic background and courses per user.
-- =============================================================================
-- Sourced from Feedz "Lista de Educação e Habilidades" export. The export
-- bundles "Habilidades" alongside courses; we keep both columns nullable so
-- skill-only or course-only rows are both valid.
-- Risk: 🟢 Low — new table only.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course text,
  area text,
  institution text,
  skill text,
  start_date date,
  end_date date,
  certificate_url text,
  source text NOT NULL DEFAULT 'manual',
  imported_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_education_has_content CHECK (
    course IS NOT NULL OR skill IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_education_user_course_inst_start
  ON public.user_education (
    user_id,
    COALESCE(course, ''),
    COALESCE(institution, ''),
    COALESCE(start_date, '1900-01-01'::date)
  );

CREATE INDEX IF NOT EXISTS idx_user_education_company ON public.user_education(company_id);
CREATE INDEX IF NOT EXISTS idx_user_education_user ON public.user_education(user_id);

ALTER TABLE public.user_education ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read user education" ON public.user_education;
CREATE POLICY "Members read user education"
ON public.user_education FOR SELECT
USING (public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "Self insert user education" ON public.user_education;
CREATE POLICY "Self insert user education"
ON public.user_education FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR public.is_company_admin(auth.uid(), company_id)
);

DROP POLICY IF EXISTS "Self update user education" ON public.user_education;
CREATE POLICY "Self update user education"
ON public.user_education FOR UPDATE
USING (
  user_id = auth.uid()
  OR public.is_company_admin(auth.uid(), company_id)
)
WITH CHECK (
  user_id = auth.uid()
  OR public.is_company_admin(auth.uid(), company_id)
);

DROP POLICY IF EXISTS "Self delete user education" ON public.user_education;
CREATE POLICY "Self delete user education"
ON public.user_education FOR DELETE
USING (
  user_id = auth.uid()
  OR public.is_company_admin(auth.uid(), company_id)
);

DROP TRIGGER IF EXISTS trg_user_education_updated_at ON public.user_education;
CREATE TRIGGER trg_user_education_updated_at
  BEFORE UPDATE ON public.user_education
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
