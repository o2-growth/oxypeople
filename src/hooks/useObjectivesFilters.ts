import { useState, useMemo, useCallback } from "react";
import { useObjectiveTree, ObjectiveWithDetails, ObjectiveType, ObjectiveStatus } from "./useObjectives";
import { isWithinInterval, differenceInDays } from "date-fns";

export interface ObjectivesFilterState {
  departments: string[];
  responsibleIds: string[];
  periodId: string | null;
  status: "all" | ObjectiveStatus;
  objectiveType: "all" | ObjectiveType;
  progressRange: [number, number] | null;
}

export interface ObjectivesStats {
  total: number;
  strategic: number;
  tactical: number;
  operational: number;
  averageProgress: number;
  byStatus: Record<string, number>;
}

const defaultFilters: ObjectivesFilterState = {
  departments: [],
  responsibleIds: [],
  periodId: null,
  status: "all",
  objectiveType: "all",
  progressRange: null,
};

export function useObjectivesFilters() {
  const [filters, setFilters] = useState<ObjectivesFilterState>(defaultFilters);
  const { tree, flatObjectives, isLoading } = useObjectiveTree();

  // Get unique departments
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    flatObjectives.forEach((obj) => {
      if (obj.department) deptSet.add(obj.department);
      const dept = (obj.team as any)?.department;
      if (dept) deptSet.add(dept);
    });
    return Array.from(deptSet).sort();
  }, [flatObjectives]);

  // Get unique responsible users
  const responsibleUsers = useMemo(() => {
    const usersMap = new Map<string, { id: string; name: string; email: string; avatar_url: string | null }>();
    flatObjectives.forEach((obj) => {
      if (obj.owner && !usersMap.has(obj.owner.id)) {
        usersMap.set(obj.owner.id, {
          id: obj.owner.id,
          name: obj.owner.full_name || obj.owner.email,
          email: obj.owner.email,
          avatar_url: obj.owner.avatar_url,
        });
      }
    });
    return Array.from(usersMap.values());
  }, [flatObjectives]);

  // Filter flat objectives
  const filteredObjectives = useMemo(() => {
    return flatObjectives.filter((obj) => {
      if (filters.departments.length > 0) {
        const objDept = obj.department || (obj.team as any)?.department;
        if (!objDept || !filters.departments.includes(objDept)) return false;
      }

      if (filters.responsibleIds.length > 0) {
        if (!obj.owner || !filters.responsibleIds.includes(obj.owner.id)) return false;
      }

      if (filters.periodId) {
        if (obj.period_id !== filters.periodId) return false;
      }

      if (filters.status !== "all") {
        if (obj.status !== filters.status) return false;
      }

      if (filters.objectiveType !== "all") {
        if (obj.type !== filters.objectiveType) return false;
      }

      if (filters.progressRange) {
        const [min, max] = filters.progressRange;
        if (obj.progress < min || obj.progress > max) return false;
      }

      return true;
    });
  }, [flatObjectives, filters]);

  // Filtered tree (keep parents visible if children match)
  const filteredTree = useMemo(() => {
    const matchingIds = new Set(filteredObjectives.map((o) => o.id));

    function filterNode(node: ObjectiveWithDetails): ObjectiveWithDetails | null {
      const filteredChildren = (node.children || [])
        .map(filterNode)
        .filter(Boolean) as ObjectiveWithDetails[];

      if (matchingIds.has(node.id) || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    }

    return tree.map(filterNode).filter(Boolean) as ObjectiveWithDetails[];
  }, [tree, filteredObjectives]);

  // Stats
  const stats = useMemo((): ObjectivesStats => {
    const total = flatObjectives.length;
    const strategic = flatObjectives.filter((o) => o.type === "strategic").length;
    const tactical = flatObjectives.filter((o) => o.type === "tactical").length;
    const operational = flatObjectives.filter((o) => o.type === "operational").length;
    const averageProgress = total > 0
      ? Math.round(flatObjectives.reduce((sum, obj) => sum + obj.progress, 0) / total)
      : 0;

    const byStatus: Record<string, number> = {};
    flatObjectives.forEach((obj) => {
      byStatus[obj.status] = (byStatus[obj.status] || 0) + 1;
    });

    return { total, strategic, tactical, operational, averageProgress, byStatus };
  }, [flatObjectives]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.departments.length > 0 ||
      filters.responsibleIds.length > 0 ||
      filters.periodId !== null ||
      filters.status !== "all" ||
      filters.objectiveType !== "all" ||
      filters.progressRange !== null
    );
  }, [filters]);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  return {
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    filteredObjectives,
    filteredTree,
    tree,
    stats,
    departments,
    responsibleUsers,
    isLoading,
  };
}
