import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";

export interface PendingInvite {
  id: string;
  email: string;
  position: string | null;
  department_id: string | null;
  department_name: string | null;
  invited_at: string;
  invited_by: string | null;
}

export interface InviteUserInput {
  email: string;
  position?: string | null;
  departmentId?: string | null;
}

interface InviteUserResponse {
  success: boolean;
  membershipId?: string;
  userId?: string;
  emailSent?: boolean;
  emailError?: string;
  error?: string;
}

const INVITES_QUERY_KEY = "pending-invites";

export function useInvitations() {
  const { profile } = useUser();
  const queryClient = useQueryClient();
  const companyId = profile?.primary_company_id;

  const pendingInvitesQuery = useQuery({
    queryKey: [INVITES_QUERY_KEY, companyId],
    queryFn: async (): Promise<PendingInvite[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("company_memberships")
        .select(
          `
            id,
            position,
            department_id,
            invited_by,
            created_at,
            user:users!company_memberships_user_id_fkey(email),
            department:departments!company_memberships_department_id_fkey(name)
          `,
        )
        .eq("company_id", companyId)
        .eq("status", "invited")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row) => {
        const user = row.user as { email: string } | null;
        const department = row.department as { name: string } | null;
        return {
          id: row.id,
          email: user?.email ?? "(sem email)",
          position: row.position ?? null,
          department_id: row.department_id ?? null,
          department_name: department?.name ?? null,
          invited_at: row.created_at,
          invited_by: row.invited_by ?? null,
        };
      });
    },
    enabled: !!companyId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [INVITES_QUERY_KEY] });
  };

  const inviteUser = useMutation({
    mutationFn: async (input: InviteUserInput): Promise<InviteUserResponse> => {
      if (!companyId) throw new Error("Empresa não identificada.");

      const { data, error } = await supabase.functions.invoke<InviteUserResponse>(
        "invite-user",
        {
          body: {
            email: input.email.trim().toLowerCase(),
            position: input.position?.trim() || null,
            departmentId: input.departmentId || null,
            companyId,
          },
        },
      );

      if (error) throw error;
      if (!data) throw new Error("Edge function retornou resposta vazia.");
      if (!data.success) throw new Error(data.error ?? "Falha ao convidar usuário");
      return data;
    },
    onSuccess: (data, variables) => {
      trackEvent("invitation_sent", {
        email_sent: data.emailSent ?? false,
        had_position: !!variables.position,
        had_department: !!variables.departmentId,
      });
      toast.success(`Convite enviado para ${variables.email}`);
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(`Falha ao convidar: ${err.message}`);
    },
  });

  const resendInvite = useMutation({
    mutationFn: async (membershipId: string): Promise<InviteUserResponse> => {
      if (!companyId) throw new Error("Empresa não identificada.");

      // Look up email + position + department from the existing membership row
      const { data: row, error: lookupErr } = await supabase
        .from("company_memberships")
        .select(
          `
            position,
            department_id,
            user:users!company_memberships_user_id_fkey(email)
          `,
        )
        .eq("id", membershipId)
        .single();

      if (lookupErr) throw lookupErr;
      const user = row.user as { email: string } | null;
      const email = user?.email;
      if (!email) throw new Error("Convite sem e-mail associado");

      const { data, error } = await supabase.functions.invoke<InviteUserResponse>(
        "invite-user",
        {
          body: {
            email,
            position: row.position ?? null,
            departmentId: row.department_id ?? null,
            companyId,
          },
        },
      );

      if (error) throw error;
      if (!data) throw new Error("Edge function retornou resposta vazia.");
      if (!data.success) throw new Error(data.error ?? "Falha ao reenviar");
      return data;
    },
    onSuccess: () => {
      trackEvent("invitation_resent");
      toast.success("Convite reenviado");
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(`Falha ao reenviar: ${err.message}`);
    },
  });

  const cancelInvite = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase
        .from("company_memberships")
        .delete()
        .eq("id", membershipId)
        .eq("status", "invited");
      if (error) throw error;
    },
    onSuccess: () => {
      trackEvent("invitation_cancelled");
      toast.success("Convite cancelado");
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(`Falha ao cancelar: ${err.message}`);
    },
  });

  return {
    pendingInvites: pendingInvitesQuery.data ?? [],
    isLoading: pendingInvitesQuery.isLoading,
    error: pendingInvitesQuery.error as Error | null,
    inviteUser,
    resendInvite,
    cancelInvite,
  };
}
