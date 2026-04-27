import { Crosshair, Target, Layers, User, Users, UserCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

export type ObjectiveType = Database["public"]["Enums"]["objective_type"];

export const ALL_OBJECTIVE_TYPES: ObjectiveType[] = [
  "strategic",
  "tactical",
  "operational",
  "personal",
  "team",
  "individual",
];

export const CANONICAL_OBJECTIVE_TYPES = ["strategic", "tactical", "operational"] as const;
export type CanonicalObjectiveType = (typeof CANONICAL_OBJECTIVE_TYPES)[number];

type TypeMeta = {
  label: string;
  shortLabel: string;
  icon: typeof Target;
  hex: string;
  bgClass: string;
  borderLeftClass: string;
  textClass: string;
};

const META: Record<ObjectiveType, TypeMeta> = {
  strategic: {
    label: "Estratégico",
    shortLabel: "Estratégico",
    icon: Crosshair,
    hex: "#a25ddc",
    bgClass: "bg-[#a25ddc]",
    borderLeftClass: "border-l-[#a25ddc]",
    textClass: "text-[#a25ddc]",
  },
  tactical: {
    label: "Tático",
    shortLabel: "Tático",
    icon: Layers,
    hex: "#579bfc",
    bgClass: "bg-[#579bfc]",
    borderLeftClass: "border-l-[#579bfc]",
    textClass: "text-[#579bfc]",
  },
  operational: {
    label: "Operacional",
    shortLabel: "Operacional",
    icon: Target,
    hex: "#00c875",
    bgClass: "bg-[#00c875]",
    borderLeftClass: "border-l-[#00c875]",
    textClass: "text-[#00c875]",
  },
  personal: {
    label: "Pessoal",
    shortLabel: "Pessoal",
    icon: User,
    hex: "#6b7280",
    bgClass: "bg-[#6b7280]",
    borderLeftClass: "border-l-[#6b7280]",
    textClass: "text-[#6b7280]",
  },
  team: {
    label: "Time",
    shortLabel: "Time",
    icon: Users,
    hex: "#0ea5e9",
    bgClass: "bg-[#0ea5e9]",
    borderLeftClass: "border-l-[#0ea5e9]",
    textClass: "text-[#0ea5e9]",
  },
  individual: {
    label: "Individual",
    shortLabel: "Individual",
    icon: UserCircle,
    hex: "#94a3b8",
    bgClass: "bg-[#94a3b8]",
    borderLeftClass: "border-l-[#94a3b8]",
    textClass: "text-[#94a3b8]",
  },
};

export function getObjectiveTypeMeta(type: ObjectiveType): TypeMeta {
  return META[type] ?? META.personal;
}

export function getObjectiveTypeLabel(type: ObjectiveType): string {
  return getObjectiveTypeMeta(type).label;
}

export function isCanonicalObjectiveType(type: ObjectiveType): type is CanonicalObjectiveType {
  return (CANONICAL_OBJECTIVE_TYPES as readonly string[]).includes(type);
}

const CHILD_TYPE: Record<ObjectiveType, ObjectiveType | null> = {
  strategic: "tactical",
  tactical: "operational",
  operational: null,
  personal: null,
  team: null,
  individual: null,
};

export function getChildObjectiveType(type: ObjectiveType): ObjectiveType | null {
  return CHILD_TYPE[type] ?? null;
}
