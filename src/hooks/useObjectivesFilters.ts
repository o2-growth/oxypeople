import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./useUser";
import { ObjectiveWithDetails } from "./useObjectives";
import { startOfQuarter, endOfQuarter, addMonths, isWithinInterval, differenceInDays } from "date-fns";

export interface ObjectivesFilterState {
  departments: string[];
  responsibleIds: string[];
  period: {
    startDate: string | null;
    endDate: string | null;
    preset: "Q1" | "Q2" | "Q3" | "Q4" | "custom" | null;
  };
  status: "all" | "active" | "completed";
  progressRange: [number, number] | null;
  visibility: "all" | "company" | "private";
  checkInStatus: "all" | "on-time" | "late";
}

export interface ObjectivesStats {
  total: number;
  averageProgress: number;
  onTrackPercentage: number;
  atRiskPercentage: number;
}

export interface GroupedObjectives {
  [department: string]: ObjectiveWithDetails[];
}

const defaultFilters: ObjectivesFilterState = {
  departments: [],
  responsibleIds: [],
  period: {
    startDate: null,
    endDate: null,
    preset: null,
  },
  status: "all",
  progressRange: null,
  visibility: "all",
  checkInStatus: "all",
};

export function useObjectivesFilters() {
  const [filters, setFilters] = useState<ObjectivesFilterState>(defaultFilters);
  const [pendingFilters, setPendingFilters] = useState<ObjectivesFilterState>(defaultFilters);
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  // Fetch all objectives with related data
  const { data: objectives = [], isLoading } = useQuery({
    queryKey: ["objectives-filtered", companyId],
    queryFn: async (): Promise<ObjectiveWithDetails[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("objectives")
        .select(`
          *,
          owner:users!objectives_owner_id_fkey(id, full_name, avatar_url, email),
          assignee:users!objectives_assignee_id_fkey(id, full_name, avatar_url, email),
          team:teams(id, name, department),
          key_results(*)
        `)
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((obj) => ({
        ...obj,
        type: obj.type as "personal" | "team" | "individual",
      })) as ObjectiveWithDetails[];
    },
    enabled: !!companyId,
  });

  // Get unique departments from teams
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    objectives.forEach((obj) => {
      const dept = (obj.team as any)?.department;
      if (dept) deptSet.add(dept);
    });
    return Array.from(deptSet).sort();
  }, [objectives]);

  // Get unique responsible users
  const responsibleUsers = useMemo(() => {
    const usersMap = new Map<string, { id: string; name: string; email: string; avatar_url: string | null }>();
    objectives.forEach((obj) => {
      if (obj.owner && !usersMap.has(obj.owner.id)) {
        usersMap.set(obj.owner.id, {
          id: obj.owner.id,
          name: obj.owner.full_name || obj.owner.email,
          email: obj.owner.email,
          avatar_url: obj.owner.avatar_url,
        });
      }
      if (obj.assignee && !usersMap.has(obj.assignee.id)) {
        usersMap.set(obj.assignee.id, {
          id: obj.assignee.id,
          name: obj.assignee.full_name || obj.assignee.email,
          email: obj.assignee.email,
          avatar_url: obj.assignee.avatar_url,
        });
      }
    });
    return Array.from(usersMap.values());
  }, [objectives]);

  // Apply filters to objectives
  const filteredObjectives = useMemo(() => {
    return objectives.filter((obj) => {
      // Filter by department
      if (filters.departments.length > 0) {
        const objDept = (obj.team as any)?.department;
        if (!objDept || !filters.departments.includes(objDept)) {
          return false;
        }
      }

      // Filter by responsible
      if (filters.responsibleIds.length > 0) {
        const isResponsible =
          (obj.owner && filters.responsibleIds.includes(obj.owner.id)) ||
          (obj.assignee && filters.responsibleIds.includes(obj.assignee.id));
        if (!isResponsible) return false;
      }

      // Filter by period
      if (filters.period.startDate && filters.period.endDate && obj.due_date) {
        const dueDate = new Date(obj.due_date);
        const start = new Date(filters.period.startDate);
        const end = new Date(filters.period.endDate);
        if (!isWithinInterval(dueDate, { start, end })) {
          return false;
        }
      }

      // Filter by status
      if (filters.status === "active" && obj.status === "completed") {
        return false;
      }
      if (filters.status === "completed" && obj.status !== "completed") {
        return false;
      }

      // Filter by progress range
      if (filters.progressRange) {
        const [min, max] = filters.progressRange;
        if (obj.progress < min || obj.progress > max) {
          return false;
        }
      }

      // Filter by visibility
      if (filters.visibility === "company" && obj.visibility !== "company") {
        return false;
      }
      if (filters.visibility === "private" && obj.visibility !== "private") {
        return false;
      }

      // Filter by check-in status
      if (filters.checkInStatus !== "all") {
        const lastCheckIn = obj.key_results.reduce((latest, kr) => {
          const krDate = new Date(kr.updated_at);
          return !latest || krDate > latest ? krDate : latest;
        }, null as Date | null);

        const daysSinceCheckIn = lastCheckIn
          ? differenceInDays(new Date(), lastCheckIn)
          : Infinity;

        if (filters.checkInStatus === "on-time" && daysSinceCheckIn > 7) {
          return false;
        }
        if (filters.checkInStatus === "late" && daysSinceCheckIn <= 7) {
          return false;
        }
      }

      return true;
    });
  }, [objectives, filters]);

  // Group by department
  const groupedByDepartment = useMemo((): GroupedObjectives => {
    const grouped: GroupedObjectives = {};
    
    filteredObjectives.forEach((obj) => {
      const dept = (obj.team as any)?.department || "Sem Departamento";
      if (!grouped[dept]) {
        grouped[dept] = [];
      }
      grouped[dept].push(obj);
    });

    return grouped;
  }, [filteredObjectives]);

  // Calculate stats
  const stats = useMemo((): ObjectivesStats => {
    const total = filteredObjectives.length;
    if (total === 0) {
      return { total: 0, averageProgress: 0, onTrackPercentage: 0, atRiskPercentage: 0 };
    }

    const averageProgress = Math.round(
      filteredObjectives.reduce((sum, obj) => sum + obj.progress, 0) / total
    );

    const onTrackCount = filteredObjectives.filter(
      (obj) => obj.status === "on-track" || obj.status === "completed"
    ).length;

    const atRiskCount = filteredObjectives.filter(
      (obj) => obj.status === "at-risk" || obj.status === "off-track"
    ).length;

    return {
      total,
      averageProgress,
      onTrackPercentage: Math.round((onTrackCount / total) * 100),
      atRiskPercentage: Math.round((atRiskCount / total) * 100),
    };
  }, [filteredObjectives]);

  // Period presets
  const setPeriodPreset = useCallback((preset: "Q1" | "Q2" | "Q3" | "Q4" | null) => {
    if (!preset) {
      setPendingFilters((prev) => ({
        ...prev,
        period: { startDate: null, endDate: null, preset: null },
      }));
      return;
    }

    const year = new Date().getFullYear();
    const quarterMap = {
      Q1: { start: new Date(year, 0, 1), end: new Date(year, 2, 31) },
      Q2: { start: new Date(year, 3, 1), end: new Date(year, 5, 30) },
      Q3: { start: new Date(year, 6, 1), end: new Date(year, 8, 30) },
      Q4: { start: new Date(year, 9, 1), end: new Date(year, 11, 31) },
    };

    const { start, end } = quarterMap[preset];
    setPendingFilters((prev) => ({
      ...prev,
      period: {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
        preset,
      },
    }));
  }, []);

  const applyFilters = useCallback(() => {
    setFilters(pendingFilters);
  }, [pendingFilters]);

  const clearFilters = useCallback(() => {
    setPendingFilters(defaultFilters);
    setFilters(defaultFilters);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.departments.length > 0 ||
      filters.responsibleIds.length > 0 ||
      filters.period.preset !== null ||
      filters.status !== "all" ||
      filters.progressRange !== null ||
      filters.visibility !== "all" ||
      filters.checkInStatus !== "all"
    );
  }, [filters]);

  const removeFilter = useCallback((key: keyof ObjectivesFilterState, value?: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (key === "departments" && value) {
        newFilters.departments = prev.departments.filter((d) => d !== value);
      } else if (key === "responsibleIds" && value) {
        newFilters.responsibleIds = prev.responsibleIds.filter((r) => r !== value);
      } else if (key === "period") {
        newFilters.period = { startDate: null, endDate: null, preset: null };
      } else if (key === "status") {
        newFilters.status = "all";
      } else if (key === "progressRange") {
        newFilters.progressRange = null;
      } else if (key === "visibility") {
        newFilters.visibility = "all";
      } else if (key === "checkInStatus") {
        newFilters.checkInStatus = "all";
      }
      return newFilters;
    });
    setPendingFilters((prev) => {
      const newFilters = { ...prev };
      if (key === "departments" && value) {
        newFilters.departments = prev.departments.filter((d) => d !== value);
      } else if (key === "responsibleIds" && value) {
        newFilters.responsibleIds = prev.responsibleIds.filter((r) => r !== value);
      } else if (key === "period") {
        newFilters.period = { startDate: null, endDate: null, preset: null };
      } else if (key === "status") {
        newFilters.status = "all";
      } else if (key === "progressRange") {
        newFilters.progressRange = null;
      } else if (key === "visibility") {
        newFilters.visibility = "all";
      } else if (key === "checkInStatus") {
        newFilters.checkInStatus = "all";
      }
      return newFilters;
    });
  }, []);

  return {
    filters,
    pendingFilters,
    setPendingFilters,
    applyFilters,
    clearFilters,
    hasActiveFilters,
    removeFilter,
    setPeriodPreset,
    filteredObjectives,
    groupedByDepartment,
    stats,
    departments,
    responsibleUsers,
    isLoading,
  };
}
