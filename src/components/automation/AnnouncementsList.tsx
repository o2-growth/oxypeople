import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/hooks/useUser";
import { AnnouncementCard } from "./AnnouncementCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type AnnouncementType = "event" | "info" | "urgent" | "celebration";

export function AnnouncementsList() {
  const { user } = useAuth();
  const { profile } = useUser();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AnnouncementType | "all">("all");

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["announcements", profile?.primary_company_id],
    queryFn: async () => {
      if (!profile?.primary_company_id) return [];

      const { data, error } = await supabase
        .from("announcements")
        .select(
          `
          *,
          author:users!announcements_author_id_fkey(full_name, avatar_url)
        `
        )
        .eq("company_id", profile.primary_company_id)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.primary_company_id,
  });

  const filteredAnnouncements = announcements?.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || a.type === typeFilter;
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar avisos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as AnnouncementType | "all")}
        >
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="event">Evento</SelectItem>
            <SelectItem value="info">Informativo</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="celebration">Celebração</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredAnnouncements?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">📢</div>
          <h3 className="text-lg font-semibold text-foreground">
            Nenhum aviso encontrado
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Crie um novo aviso para comunicar sua equipe
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAnnouncements?.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
            />
          ))}
        </div>
      )}
    </div>
  );
}
