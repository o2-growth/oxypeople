import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    // 1. Get all active objectives with their settings
    const { data: companies } = await supabase
      .from('companies')
      .select('id');

    if (!companies?.length) {
      return new Response(JSON.stringify({ success: true, message: 'No companies' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let totalEscalations = 0;

    for (const company of companies) {
      // Get settings
      const { data: settings } = await supabase
        .from('okr_settings')
        .select('*')
        .eq('company_id', company.id)
        .maybeSingle();

      const overdueDays = settings?.checkin_overdue_days || 7;
      const riskDays = settings?.risk_days_before_escalation || 3;

      // Get active objectives
      const { data: objectives } = await supabase
        .from('objectives')
        .select(`
          id, title, type, progress, auto_status, expected_progress, owner_id, team_id, company_id,
          owner:users!objectives_owner_id_fkey(id, full_name, email),
          key_results(id, title, current_value, target_value, last_checkin_at)
        `)
        .eq('company_id', company.id)
        .eq('is_active', true)
        .in('status', ['planned', 'active']);

      if (!objectives?.length) continue;

      // Update auto-status for each objective
      for (const obj of objectives) {
        await supabase.rpc('update_objective_auto_status', { p_objective_id: obj.id });
      }

      // Re-fetch with updated statuses
      const { data: updatedObjectives } = await supabase
        .from('objectives')
        .select(`
          id, title, type, progress, auto_status, expected_progress, owner_id, team_id, company_id,
          owner:users!objectives_owner_id_fkey(id, full_name, email)
        `)
        .eq('company_id', company.id)
        .eq('is_active', true)
        .in('auto_status', ['risk', 'overdue']);

      if (!updatedObjectives?.length) continue;

      // For each at-risk objective, create escalation notifications
      for (const obj of updatedObjectives) {
        const ownerName = (obj.owner as any)?.full_name || (obj.owner as any)?.email || 'Desconhecido';
        const deviation = Math.round(Number(obj.expected_progress || 0) - obj.progress);
        const statusLabel = obj.auto_status === 'overdue' ? '⏰ ATRASADO' : '🔴 EM RISCO';

        // Determine who to notify based on objective type
        const notifyUserIds: string[] = [];

        // Always notify the owner
        if (obj.owner_id) notifyUserIds.push(obj.owner_id);

        // For operational: notify team leader
        if (obj.type === 'operational' && obj.team_id) {
          const { data: leaders } = await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', obj.team_id)
            .eq('role', 'leader');
          leaders?.forEach(l => {
            if (!notifyUserIds.includes(l.user_id)) notifyUserIds.push(l.user_id);
          });
        }

        // For tactical/strategic: notify admins
        if (obj.type === 'tactical' || obj.type === 'strategic') {
          const { data: admins } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('company_id', company.id)
            .in('role', ['admin', 'owner']);
          admins?.forEach(a => {
            if (!notifyUserIds.includes(a.user_id)) notifyUserIds.push(a.user_id);
          });
        }

        const message = `${statusLabel} — "${obj.title}" (${ownerName}) está ${deviation}% abaixo da curva esperada. Progresso: ${obj.progress}% vs esperado ${Math.round(Number(obj.expected_progress || 0))}%.`;

        // Create notifications
        for (const userId of notifyUserIds) {
          // Check if we already notified today
          const today = new Date().toISOString().split('T')[0];
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', userId)
            .eq('reference_id', obj.id)
            .eq('type', 'okr_escalation')
            .gte('created_at', today)
            .limit(1);

          if (existing && existing.length > 0) continue;

          await supabase.from('notifications').insert({
            user_id: userId,
            company_id: company.id,
            type: 'okr_escalation',
            title: `OKR ${statusLabel}`,
            message,
            reference_id: obj.id,
            reference_type: 'objective',
          });

          totalEscalations++;
        }

      }
    }

    return new Response(
      JSON.stringify({ success: true, escalations: totalEscalations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in okr-escalation:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
