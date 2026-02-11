import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CreatePost } from "@/components/feed/CreatePost";
import { FeedPost } from "@/components/feed/FeedPost";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { usePosts } from "@/hooks/usePosts";
import { useCompanyEvents, type CompanyEvent } from "@/hooks/useCompanyEvents";
import { useHRCalendar } from "@/hooks/useHRCalendar";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { UpcomingEventsCarousel } from "@/components/mural/UpcomingEventsCarousel";
import { PinnedAnnouncements } from "@/components/mural/PinnedAnnouncements";
import { MiniCalendar } from "@/components/mural/MiniCalendar";
import { BirthdaysList } from "@/components/mural/BirthdaysList";
import { MonthHighlights } from "@/components/mural/MonthHighlights";
import { CreateEventDialog } from "@/components/mural/CreateEventDialog";
import { EventDetailDialog } from "@/components/mural/EventDetailDialog";

const Feed = () => {
  const { data: posts, isLoading: loadingPosts, error } = usePosts();
  const { data: events, isLoading: loadingEvents } = useCompanyEvents();
  const { data: hrEvents, isLoading: loadingHR } = useHRCalendar("month");
  const { isAdmin } = useUserPermissions();

  const [selectedEvent, setSelectedEvent] = useState<CompanyEvent | null>(null);

  const birthdays = useMemo(
    () => (hrEvents || []).filter((e) => e.type === "birthday"),
    [hrEvents]
  );

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold mb-1">Mural da Empresa</h1>
            <p className="text-muted-foreground text-sm">
              Eventos, comunicados e tudo que está acontecendo
            </p>
          </div>
          {isAdmin && <CreateEventDialog />}
        </div>

        {/* Upcoming Events Carousel */}
        <section>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
            Próximos Eventos
          </h2>
          <UpcomingEventsCarousel
            events={events}
            isLoading={loadingEvents}
            onEventClick={(e) => setSelectedEvent(e)}
          />
        </section>

        {/* Main grid: 2/3 + 1/3 */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <PinnedAnnouncements />
            <CreatePost />

            {/* Feed */}
            {loadingPosts ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-3.5 w-28" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-4xl mb-4">😕</div>
                  <h3 className="text-lg font-semibold">Erro ao carregar posts</h3>
                  <p className="text-sm text-muted-foreground mt-1">Tente recarregar a página</p>
                </CardContent>
              </Card>
            ) : posts && posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <FeedPost key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-lg font-semibold">Nenhum post ainda</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Seja o primeiro a compartilhar algo com a equipe!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="space-y-4">
            <MiniCalendar events={events || []} hrEvents={hrEvents || []} />
            <BirthdaysList birthdays={birthdays} isLoading={loadingHR} />
            <MonthHighlights />
          </aside>
        </div>
      </div>

      <EventDetailDialog
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      />
    </AppLayout>
  );
};

export default Feed;
