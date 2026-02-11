import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CompanyEvent } from "@/hooks/useCompanyEvents";

const EVENT_TYPE_LABELS: Record<string, string> = {
  monthly: "Monthly",
  happy_hour: "Happy Hour",
  training: "Treinamento",
  town_hall: "Town Hall",
  celebration: "Celebração",
  other: "Evento",
};

interface EventDetailDialogProps {
  event: CompanyEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailDialog({ event, open, onOpenChange }: EventDetailDialogProps) {
  if (!event) return null;

  const eventDate = new Date(event.event_date);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: event.color }} />
            <Badge variant="secondary">{EVENT_TYPE_LABELS[event.event_type] || event.event_type}</Badge>
          </div>
          <DialogTitle className="text-xl mt-2">{event.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>{format(eventDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{format(eventDate, "HH:mm", { locale: ptBR })}</span>
            {event.end_date && <span>— {format(new Date(event.end_date), "HH:mm", { locale: ptBR })}</span>}
          </div>
          {event.location && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
          {event.description && (
            <div className="pt-2 border-t">
              <p className="text-sm whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
