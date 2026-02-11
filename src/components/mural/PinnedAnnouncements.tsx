import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pin, AlertTriangle, Info, Megaphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  urgent: { icon: <AlertTriangle className="h-4 w-4" />, color: "text-destructive" },
  info: { icon: <Info className="h-4 w-4" />, color: "text-primary" },
  update: { icon: <Megaphone className="h-4 w-4" />, color: "text-warning" },
};

export function PinnedAnnouncements() {
  const { profile } = useUser();
  const navigate = useNavigate();

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["pinned-announcements", profile?.primary_company_id],
    queryFn: async () => {
      if (!profile?.primary_company_id) return [];

      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, content, type, created_at")
        .eq("company_id", profile.primary_company_id)
        .eq("is_pinned", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.primary_company_id,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!announcements || announcements.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Pin className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Avisos Fixados</h3>
      </div>
      {announcements.map((a) => {
        const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.info;
        return (
          <Card key={a.id} className="border-l-4 border-l-primary/40">
            <CardContent className="p-3 flex items-start gap-3">
              <span className={cfg.color}>{cfg.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium line-clamp-1">{a.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{a.content}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
      {announcements.length >= 3 && (
        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate("/automation")}>
          Ver todos os avisos →
        </Button>
      )}
    </div>
  );
}
