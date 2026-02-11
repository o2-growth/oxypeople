import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRef, useState } from "react";
import type { CompanyEvent } from "@/hooks/useCompanyEvents";

const EVENT_TYPE_LABELS: Record<string, string> = {
  monthly: "Monthly",
  happy_hour: "Happy Hour",
  training: "Treinamento",
  town_hall: "Town Hall",
  celebration: "Celebração",
  other: "Evento",
};

interface UpcomingEventsCarouselProps {
  events: CompanyEvent[] | undefined;
  isLoading: boolean;
  onEventClick: (event: CompanyEvent) => void;
}

export function UpcomingEventsCarousel({ events, isLoading, onEventClick }: UpcomingEventsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
    setTimeout(updateScrollButtons, 350);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-64 shrink-0 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card className="border-dashed border-2 border-border/60">
        <CardContent className="flex items-center justify-center py-8 text-center">
          <div>
            <CalendarDays className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum evento próximo</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative group">
      {canScrollLeft && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      <div
        ref={scrollRef}
        onScroll={updateScrollButtons}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-1 snap-x"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {events.map((event) => (
          <Card
            key={event.id}
            className="shrink-0 w-64 cursor-pointer hover:shadow-lg transition-all snap-start border-l-4"
            style={{ borderLeftColor: event.color }}
            onClick={() => onEventClick(event)}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                </Badge>
              </div>
              <h4 className="font-semibold text-sm line-clamp-2">{event.title}</h4>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{format(new Date(event.event_date), "dd MMM · HH:mm", { locale: ptBR })}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {canScrollRight && events.length > 3 && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
