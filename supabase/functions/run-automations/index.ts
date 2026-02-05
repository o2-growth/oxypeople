import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SLACK_API_URL = "https://slack.com/api";

interface AutomationConfig {
  message_template?: string;
  send_to_slack?: boolean;
  send_to_feed?: boolean;
  send_time?: string;
}

interface UserWithBirthday {
  id: string;
  full_name: string | null;
  birth_date: string | null;
}

interface MembershipWithUser {
  user_id: string;
  hire_date: string | null;
  is_new_hire: boolean | null;
  position: string | null;
  company_id: string;
  users: {
    id: string;
    full_name: string | null;
  };
  departments: {
    name: string;
  } | null;
}

async function sendSlackMessage(
  botToken: string,
  message: string
): Promise<boolean> {
  try {
    const response = await fetch(`${SLACK_API_URL}/chat.postMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: "#general",
        text: message,
      }),
    });
    const data = await response.json();
    return data.ok === true;
  } catch (error) {
    console.error("Error sending Slack message:", error);
    return false;
  }
}

async function createFeedPost(
  supabase: ReturnType<typeof createClient>,
  companyId: string,
  content: string,
  systemUserId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from("posts").insert({
      company_id: companyId,
      author_id: systemUserId,
      content,
      visibility: "company",
    });
    return !error;
  } catch (error) {
    console.error("Error creating feed post:", error);
    return false;
  }
}

async function logAutomation(
  supabase: ReturnType<typeof createClient>,
  automationId: string,
  companyId: string,
  eventType: string,
  status: "success" | "failed",
  messageSent: string,
  targetUserId?: string
): Promise<void> {
  try {
    await supabase.from("automation_logs").insert({
      automation_id: automationId,
      company_id: companyId,
      event_type: eventType,
      status,
      message_sent: messageSent,
      target_user_id: targetUserId,
    });
  } catch (error) {
    console.error("Error logging automation:", error);
  }
}

function formatMessage(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value || "");
  }
  return result;
}

function isTodayBirthday(birthDate: string): boolean {
  const today = new Date();
  const birth = new Date(birthDate);
  return (
    birth.getMonth() === today.getMonth() &&
    birth.getDate() === today.getDate()
  );
}

function getYearsOfService(hireDate: string): number {
  const today = new Date();
  const hire = new Date(hireDate);
  let years = today.getFullYear() - hire.getFullYear();
  const monthDiff = today.getMonth() - hire.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < hire.getDate())
  ) {
    years--;
  }
  return years;
}

function isAnniversaryToday(hireDate: string): boolean {
  const today = new Date();
  const hire = new Date(hireDate);
  return (
    hire.getMonth() === today.getMonth() &&
    hire.getDate() === today.getDate() &&
    hire.getFullYear() < today.getFullYear()
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const slackBotToken = Deno.env.get("SLACK_BOT_TOKEN");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all enabled automations
    const { data: automations, error: automationsError } = await supabase
      .from("automations")
      .select("*")
      .eq("enabled", true);

    if (automationsError) {
      throw new Error(`Failed to fetch automations: ${automationsError.message}`);
    }

    const results: Array<{
      type: string;
      company_id: string;
      processed: number;
      errors: number;
    }> = [];

    for (const automation of automations || []) {
      const config = automation.config as AutomationConfig;
      const companyId = automation.company_id;
      let processed = 0;
      let errors = 0;

      // Birthday automations
      if (automation.type === "birthday") {
        const { data: users } = await supabase
          .from("company_memberships")
          .select(`
            user_id,
            users!company_memberships_user_id_fkey(id, full_name, birth_date)
          `)
          .eq("company_id", companyId)
          .eq("status", "active");

        for (const membership of users || []) {
          const user = membership.users as unknown as UserWithBirthday;
          if (!user?.birth_date || !isTodayBirthday(user.birth_date)) continue;

          const message = formatMessage(
            config.message_template ||
              "🎂 Hoje é aniversário de {name}! Desejamos um dia incrível! 🎉",
            { name: user.full_name || "Colaborador" }
          );

          let success = true;

          if (config.send_to_slack && slackBotToken) {
            const slackSent = await sendSlackMessage(slackBotToken, message);
            if (!slackSent) success = false;
          }

          if (config.send_to_feed) {
            // Use the first admin as the author
            const { data: adminRole } = await supabase
              .from("user_roles")
              .select("user_id")
              .eq("company_id", companyId)
              .in("role", ["owner", "admin"])
              .limit(1)
              .single();

            if (adminRole) {
              const feedSent = await createFeedPost(
                supabase,
                companyId,
                message,
                adminRole.user_id
              );
              if (!feedSent) success = false;
            }
          }

          await logAutomation(
            supabase,
            automation.id,
            companyId,
            "birthday",
            success ? "success" : "failed",
            message,
            user.id
          );

          if (success) processed++;
          else errors++;
        }
      }

      // Anniversary automations
      if (automation.type === "anniversary") {
        const { data: memberships } = await supabase
          .from("company_memberships")
          .select(`
            user_id,
            hire_date,
            users!company_memberships_user_id_fkey(id, full_name)
          `)
          .eq("company_id", companyId)
          .eq("status", "active")
          .not("hire_date", "is", null);

        for (const membership of memberships || []) {
          if (!membership.hire_date || !isAnniversaryToday(membership.hire_date))
            continue;

          const user = membership.users as unknown as { id: string; full_name: string | null };
          const years = getYearsOfService(membership.hire_date);

          const message = formatMessage(
            config.message_template ||
              "🎉 {name} completa {years} ano(s) de empresa hoje! Parabéns! 🚀",
            {
              name: user?.full_name || "Colaborador",
              years: years.toString(),
            }
          );

          let success = true;

          if (config.send_to_slack && slackBotToken) {
            const slackSent = await sendSlackMessage(slackBotToken, message);
            if (!slackSent) success = false;
          }

          if (config.send_to_feed) {
            const { data: adminRole } = await supabase
              .from("user_roles")
              .select("user_id")
              .eq("company_id", companyId)
              .in("role", ["owner", "admin"])
              .limit(1)
              .single();

            if (adminRole) {
              const feedSent = await createFeedPost(
                supabase,
                companyId,
                message,
                adminRole.user_id
              );
              if (!feedSent) success = false;
            }
          }

          await logAutomation(
            supabase,
            automation.id,
            companyId,
            "anniversary",
            success ? "success" : "failed",
            message,
            user?.id
          );

          if (success) processed++;
          else errors++;
        }
      }

      // New hire automations
      if (automation.type === "new_hire") {
        const { data: newHires } = await supabase
          .from("company_memberships")
          .select(`
            user_id,
            position,
            department_id,
            users!company_memberships_user_id_fkey(id, full_name),
            departments(name)
          `)
          .eq("company_id", companyId)
          .eq("status", "active")
          .eq("is_new_hire", true);

        for (const membership of newHires || []) {
          const user = membership.users as unknown as { id: string; full_name: string | null };
          const dept = membership.departments as unknown as { name: string } | null;

          const message = formatMessage(
            config.message_template ||
              "👋 Damos as boas-vindas a {name}! Seja bem-vindo(a)!",
            {
              name: user?.full_name || "Novo colaborador",
              department: dept?.name || "Empresa",
              position: membership.position || "",
            }
          );

          let success = true;

          if (config.send_to_slack && slackBotToken) {
            const slackSent = await sendSlackMessage(slackBotToken, message);
            if (!slackSent) success = false;
          }

          if (config.send_to_feed) {
            const { data: adminRole } = await supabase
              .from("user_roles")
              .select("user_id")
              .eq("company_id", companyId)
              .in("role", ["owner", "admin"])
              .limit(1)
              .single();

            if (adminRole) {
              const feedSent = await createFeedPost(
                supabase,
                companyId,
                message,
                adminRole.user_id
              );
              if (!feedSent) success = false;
            }
          }

          // Mark as no longer new hire
          await supabase
            .from("company_memberships")
            .update({ is_new_hire: false })
            .eq("user_id", membership.user_id)
            .eq("company_id", companyId);

          await logAutomation(
            supabase,
            automation.id,
            companyId,
            "new_hire",
            success ? "success" : "failed",
            message,
            user?.id
          );

          if (success) processed++;
          else errors++;
        }
      }

      // Update last_run_at
      await supabase
        .from("automations")
        .update({ last_run_at: new Date().toISOString() })
        .eq("id", automation.id);

      results.push({
        type: automation.type,
        company_id: companyId,
        processed,
        errors,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in run-automations:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
