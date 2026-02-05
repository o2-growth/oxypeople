import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ConfigureAutomationDialog } from "./ConfigureAutomationDialog";

type AutomationType = "birthday" | "anniversary" | "new_hire" | "reminder";

interface AutomationConfig {
  message_template?: string;
  send_to_slack?: boolean;
  send_to_feed?: boolean;
  send_time?: string;
}

interface AutomationCardProps {
  type: AutomationType;
  title: string;
  description: string;
  icon: string;
}

export function AutomationCard({
  type,
  title,
  description,
  icon,
}: AutomationCardProps) {
  const { profile } = useUser();
  const queryClient = useQueryClient();
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const { data: automation } = useQuery({
    queryKey: ["automation", type, profile?.primary_company_id],
    queryFn: async () => {
      if (!profile?.primary_company_id) return null;

      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .eq("company_id", profile.primary_company_id)
        .eq("type", type)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.primary_company_id,
  });

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!profile?.primary_company_id) throw new Error("No company");

      if (automation) {
        const { error } = await supabase
          .from("automations")
          .update({ enabled })
          .eq("id", automation.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("automations").insert({
          company_id: profile.primary_company_id,
          name: title,
          type,
          enabled,
          config: {},
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["automation", type, profile?.primary_company_id],
      });
      toast.success("Automação atualizada");
    },
    onError: () => {
      toast.error("Erro ao atualizar automação");
    },
  });

  const isEnabled = automation?.enabled ?? false;
  const config = automation?.config as AutomationConfig | undefined;

  return (
    <>
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <CardTitle className="text-base">{title}</CardTitle>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={(checked) => toggleMutation.mutate(checked)}
              disabled={toggleMutation.isPending}
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 w-full justify-between"
            onClick={() => setIsConfigOpen(true)}
          >
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurar
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <ConfigureAutomationDialog
        open={isConfigOpen}
        onOpenChange={setIsConfigOpen}
        automationType={type}
        automationId={automation?.id}
        currentConfig={config}
      />
    </>
  );
}
