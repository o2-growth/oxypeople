import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./useUser";

export interface DepartmentOption {
  id: string;
  name: string;
  color: string | null;
}

export function useDepartmentOptions() {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["department-options", companyId],
    queryFn: async (): Promise<DepartmentOption[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("departments")
        .select("id, name, color")
        .eq("company_id", companyId)
        .order("name");

      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

export interface UserBirthday {
  userId: string;
  birthDate: string | null;
}

export function useUserBirthdays(userIds: string[]) {
  return useQuery({
    queryKey: ["user-birthdays", userIds],
    queryFn: async (): Promise<Map<string, string | null>> => {
      if (userIds.length === 0) return new Map();

      const { data, error } = await supabase
        .from("users")
        .select("id, birth_date")
        .in("id", userIds);

      if (error) throw error;

      const birthdayMap = new Map<string, string | null>();
      (data || []).forEach((user) => {
        birthdayMap.set(user.id, user.birth_date);
      });

      return birthdayMap;
    },
    enabled: userIds.length > 0,
  });
}
