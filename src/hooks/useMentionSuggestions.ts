import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";

export interface MentionUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
}

export interface MentionDepartment {
  id: string;
  name: string;
  color: string | null;
}

export interface MentionSuggestions {
  users: MentionUser[];
  departments: MentionDepartment[];
}

export function useMentionSuggestions(searchText: string) {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  return useQuery({
    queryKey: ["mention-suggestions", companyId, searchText],
    queryFn: async (): Promise<MentionSuggestions> => {
      if (!companyId) return { users: [], departments: [] };

      const searchLower = searchText.toLowerCase();

      // Fetch users from company
      const { data: memberships } = await supabase
        .from("company_memberships")
        .select(`
          user_id,
          users:user_id(id, full_name, avatar_url, email)
        `)
        .eq("company_id", companyId)
        .eq("status", "active");

      const users: MentionUser[] = (memberships || [])
        .map((m) => m.users as unknown as MentionUser)
        .filter((u): u is MentionUser => u !== null)
        .filter((u) => {
          if (!searchText) return true;
          const name = u.full_name?.toLowerCase() || "";
          const email = u.email.toLowerCase();
          return name.includes(searchLower) || email.includes(searchLower);
        });

      // Fetch departments
      const { data: departments } = await supabase
        .from("departments")
        .select("id, name, color")
        .eq("company_id", companyId);

      const filteredDepartments = (departments || []).filter((d) => {
        if (!searchText) return true;
        return d.name.toLowerCase().includes(searchLower);
      });

      return {
        users,
        departments: filteredDepartments,
      };
    },
    enabled: !!companyId,
    staleTime: 30000, // Cache for 30 seconds
  });
}
