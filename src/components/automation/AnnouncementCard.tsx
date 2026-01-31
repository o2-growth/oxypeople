import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pin, Calendar, Slack, MoreVertical, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AnnouncementType = "event" | "info" | "urgent" | "celebration";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  is_pinned: boolean;
  published_at: string | null;
  scheduled_at: string | null;
  slack_sent_at: string | null;
  author: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface AnnouncementCardProps {
  announcement: Announcement;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const typeConfig: Record<
  AnnouncementType,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: string }
> = {
  event: { label: "Evento", variant: "default", icon: "📅" },
  info: { label: "Informativo", variant: "secondary", icon: "ℹ️" },
  urgent: { label: "Urgente", variant: "destructive", icon: "🚨" },
  celebration: { label: "Celebração", variant: "outline", icon: "🎉" },
};

export function AnnouncementCard({
  announcement,
  onEdit,
  onDelete,
}: AnnouncementCardProps) {
  const config = typeConfig[announcement.type];
  const displayDate = announcement.published_at || announcement.scheduled_at;

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        announcement.is_pinned && "border-primary/50 bg-primary/5"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">
                  {announcement.title}
                </h3>
                {announcement.is_pinned && (
                  <Pin className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={config.variant}>{config.label}</Badge>
                {displayDate && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(displayDate), "dd MMM yyyy", {
                      locale: ptBR,
                    })}
                  </span>
                )}
                {announcement.slack_sent_at && (
                  <Slack className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(announcement.id)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(announcement.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {announcement.content}
        </p>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <Avatar className="h-6 w-6">
            <AvatarImage src={announcement.author.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {announcement.author.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            {announcement.author.full_name}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
