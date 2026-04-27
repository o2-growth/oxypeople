-- =============================================================================
-- 0005 — Nine Box: performance × potential matrix snapshots
-- =============================================================================
-- Sources: brownfield-assessment.md (P0 #7), architecture-review.md §5.7
-- Risk: 🟢 Low — new tables, admin-only writes
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. nine_box_snapshots — frozen point-in-time of a perf cycle
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nine_box_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cycle_id uuid REFERENCES public.performance_cycles(id) ON DELETE SET NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'archived')),
  created_by uuid NOT NULL REFERENCES public.users(id),
  finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nine_box_snapshots_company ON public.nine_box_snapshots(company_id);
CREATE INDEX IF NOT EXISTS idx_nine_box_snapshots_cycle ON public.nine_box_snapshots(cycle_id) WHERE cycle_id IS NOT NULL;

ALTER TABLE public.nine_box_snapshots ENABLE ROW LEVEL SECURITY;

-- SELECT: admins + managers (managers see their own subtree only — enforced at app level via filter)
DROP POLICY IF EXISTS "Managers view nine box snapshots" ON public.nine_box_snapshots;
CREATE POLICY "Managers view nine box snapshots"
ON public.nine_box_snapshots FOR SELECT
USING (
  public.is_company_admin(auth.uid(), company_id)
  OR public.get_user_role(auth.uid(), company_id) = 'manager'
);

DROP POLICY IF EXISTS "Admins create nine box snapshots" ON public.nine_box_snapshots;
CREATE POLICY "Admins create nine box snapshots"
ON public.nine_box_snapshots FOR INSERT
WITH CHECK (
  public.is_company_admin(auth.uid(), company_id)
  AND created_by = auth.uid()
);

DROP POLICY IF EXISTS "Admins update nine box snapshots" ON public.nine_box_snapshots;
CREATE POLICY "Admins update nine box snapshots"
ON public.nine_box_snapshots FOR UPDATE
USING (
  public.is_company_admin(auth.uid(), company_id)
  AND status <> 'archived'
);

DROP POLICY IF EXISTS "Admins delete draft snapshots" ON public.nine_box_snapshots;
CREATE POLICY "Admins delete draft snapshots"
ON public.nine_box_snapshots FOR DELETE
USING (
  public.is_company_admin(auth.uid(), company_id)
  AND status = 'draft'
);

DROP TRIGGER IF EXISTS update_nine_box_snapshots_updated_at ON public.nine_box_snapshots;
CREATE TRIGGER update_nine_box_snapshots_updated_at
  BEFORE UPDATE ON public.nine_box_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- -----------------------------------------------------------------------------
-- 2. nine_box_placements — one per (snapshot, user)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nine_box_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES public.nine_box_snapshots(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  performance_axis smallint NOT NULL CHECK (performance_axis BETWEEN 1 AND 3),
  potential_axis smallint NOT NULL CHECK (potential_axis BETWEEN 1 AND 3),
  performance_source text NOT NULL DEFAULT 'auto'
    CHECK (performance_source IN ('auto', 'manual', 'auto_overridden')),
  raw_evaluation_score numeric(5,2),  -- snapshot of overall_score at placement time
  justification text,
  placed_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT nine_box_placements_unique_user UNIQUE (snapshot_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_nine_box_placements_snapshot ON public.nine_box_placements(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_nine_box_placements_user ON public.nine_box_placements(user_id);
CREATE INDEX IF NOT EXISTS idx_nine_box_placements_box ON public.nine_box_placements(snapshot_id, performance_axis, potential_axis);

ALTER TABLE public.nine_box_placements ENABLE ROW LEVEL SECURITY;

-- SELECT: same audience as parent snapshot
DROP POLICY IF EXISTS "View placements via snapshot access" ON public.nine_box_placements;
CREATE POLICY "View placements via snapshot access"
ON public.nine_box_placements FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.nine_box_snapshots s
  WHERE s.id = nine_box_placements.snapshot_id
    AND (
      public.is_company_admin(auth.uid(), s.company_id)
      OR public.get_user_role(auth.uid(), s.company_id) = 'manager'
    )
));

-- INSERT/UPDATE/DELETE: admins on draft snapshots
DROP POLICY IF EXISTS "Admins manage placements on drafts" ON public.nine_box_placements;
CREATE POLICY "Admins manage placements on drafts"
ON public.nine_box_placements FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.nine_box_snapshots s
  WHERE s.id = nine_box_placements.snapshot_id
    AND s.status = 'draft'
    AND public.is_company_admin(auth.uid(), s.company_id)
));

DROP POLICY IF EXISTS "Admins update placements on drafts" ON public.nine_box_placements;
CREATE POLICY "Admins update placements on drafts"
ON public.nine_box_placements FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.nine_box_snapshots s
  WHERE s.id = nine_box_placements.snapshot_id
    AND s.status = 'draft'
    AND public.is_company_admin(auth.uid(), s.company_id)
));

DROP POLICY IF EXISTS "Admins delete placements on drafts" ON public.nine_box_placements;
CREATE POLICY "Admins delete placements on drafts"
ON public.nine_box_placements FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.nine_box_snapshots s
  WHERE s.id = nine_box_placements.snapshot_id
    AND s.status = 'draft'
    AND public.is_company_admin(auth.uid(), s.company_id)
));

DROP TRIGGER IF EXISTS update_nine_box_placements_updated_at ON public.nine_box_placements;
CREATE TRIGGER update_nine_box_placements_updated_at
  BEFORE UPDATE ON public.nine_box_placements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- END 0005
-- =============================================================================
