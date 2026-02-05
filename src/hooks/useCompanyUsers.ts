import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "./useUser";

interface CompanyUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export function useCompanyUsers() {
  const { profile } = useUser();

  return useQuery({
    queryKey: ["company-users", profile?.primary_company_id],
    queryFn: async (): Promise<CompanyUser[]> => {
      if (!profile?.primary_company_id) return [];

      const { data, error } = await supabase
        .from("company_memberships")
        .select(`
          user_id,
          users!company_memberships_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq("company_id", profile.primary_company_id)
        .eq("status", "active")
        .neq("user_id", profile.id); // Exclude current user

      if (error) {
        console.error("Error fetching company users:", error);
        throw error;
      }

      return (data || [])
        .map((m) => m.users as CompanyUser)
        .filter(Boolean)
        .sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
    },
    enabled: !!profile?.primary_company_id && !!profile?.id,
  });
}
