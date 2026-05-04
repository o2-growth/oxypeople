import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";

export interface NineBoxPlacement {
  id: string;
  user_id: string;
  performance_axis: number;
  potential_axis: number;
  performance_source: "auto" | "manual" | "auto_overridden";
  raw_evaluation_score: number | null;
  justification: string | null;
  user: { id: string; full_name: string | null; avatar_url: string | null } | null;
}

export interface NineBoxSnapshotDetail {
  id: string;
  company_id: string;
  cycle_id: string | null;
  name: string;
  status: "draft" | "finalized" | "archived";
  finalized_at: string | null;
  created_at: string;
  cycle_name: string | null;
}

export interface PoolUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export const NINE_BOX_DETAIL_KEY = "nine-box-detail";

export function useNineBoxSnapshot(snapshotId: string | undefined) {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: [NINE_BOX_DETAIL_KEY, snapshotId],
    queryFn: async (): Promise<{
      snapshot: NineBoxSnapshotDetail | null;
      placements: NineBoxPlacement[];
      pool: PoolUser[];
    }> => {
      if (!snapshotId || !companyId) return { snapshot: null, placements: [], pool: [] };

      const { data: snap, error: snapErr } = await supabase
        .from("nine_box_snapshots")
        .select(`
          id, company_id, cycle_id, name, status, finalized_at, created_at,
          cycle:performance_cycles(id, name)
        `)
        .eq("id", snapshotId)
        .maybeSingle();
      if (snapErr) throw snapErr;
      if (!snap) return { snapshot: null, placements: [], pool: [] };

      const cycleRel = snap.cycle as { id: string; name: string } | { id: string; name: string }[] | null;
      const cycle = Array.isArray(cycleRel) ? cycleRel[0] : cycleRel;
      const snapshot: NineBoxSnapshotDetail = {
        id: snap.id,
        company_id: snap.company_id,
        cycle_id: snap.cycle_id,
        name: snap.name,
        status: snap.status as NineBoxSnapshotDetail["status"],
        finalized_at: snap.finalized_at,
        created_at: snap.created_at,
        cycle_name: cycle?.name ?? null,
      };

      // Placements + user join
      const { data: placementRows, error: placementErr } = await supabase
        .from("nine_box_placements")
        .select(`
          id, user_id, performance_axis, potential_axis,
          performance_source, raw_evaluation_score, justification,
          user:users!nine_box_placements_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq("snapshot_id", snapshotId);
      if (placementErr) throw placementErr;

      const placements: NineBoxPlacement[] = (placementRows ?? []).map((p) => {
        const userRel = p.user as { id: string; full_name: string | null; avatar_url: string | null } | { id: string; full_name: string | null; avatar_url: string | null }[] | null;
        const user = Array.isArray(userRel) ? userRel[0] : userRel;
        return {
          id: p.id,
          user_id: p.user_id,
          performance_axis: p.performance_axis,
          potential_axis: p.potential_axis,
          performance_source: p.performance_source as NineBoxPlacement["performance_source"],
          raw_evaluation_score: p.raw_evaluation_score,
          justification: p.justification,
          user: user ?? null,
        };
      });

      // Pool: membros ativos da empresa que ainda não estão no snapshot
      const placedIds = new Set(placements.map((p) => p.user_id));
      const { data: members } = await supabase
        .from("company_memberships")
        .select(`
          user_id,
          user:users!company_memberships_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq("company_id", companyId)
        .eq("status", "active");

      const pool: PoolUser[] = ((members ?? []) as Array<{ user_id: string; user: PoolUser | PoolUser[] | null }>)
        .map((m) => (Array.isArray(m.user) ? m.user[0] : m.user))
        .filter((u): u is PoolUser => Boolean(u))
        .filter((u) => !placedIds.has(u.id))
        .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));

      return { snapshot, placements, pool };
    },
    enabled: !!snapshotId && !!companyId,
  });
}
