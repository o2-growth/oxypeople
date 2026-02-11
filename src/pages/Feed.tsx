import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CreatePost } from "@/components/feed/CreatePost";
import { FeedPost } from "@/components/feed/FeedPost";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Award, PartyPopper, Image, Trophy, Filter } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { useTopRecognized } from "@/hooks/useTopRecognized";
import { useTrendingTopics } from "@/hooks/useTrendingTopics";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

type FilterType = "all" | "celebrations" | "recognitions" | "images";

const filters: { key: FilterType; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "Todos", icon: <Filter className="h-3.5 w-3.5" /> },
  { key: "celebrations", label: "Celebrações", icon: <PartyPopper className="h-3.5 w-3.5" /> },
  { key: "recognitions", label: "Reconhecimentos", icon: <Trophy className="h-3.5 w-3.5" /> },
  { key: "images", label: "Com Imagens", icon: <Image className="h-3.5 w-3.5" /> },
];

const Feed = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const { data: posts, isLoading, error } = usePosts();
  const { data: topRecognized, isLoading: loadingTopRecognized } = useTopRecognized(3);
  const { data: trendingTopics, isLoading: loadingTrending } = useTrendingTopics(4);
  const navigate = useNavigate();

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    if (activeFilter === "all") return posts;

    return posts.filter((post) => {
      const metadata = post.metadata as Record<string, unknown> | null;
      switch (activeFilter) {
        case "celebrations": {
          const mentions = metadata?.mentions as { users?: string[]; departments?: string[]; everyone?: boolean } | undefined;
          return mentions && (mentions.users?.length || mentions.departments?.length || mentions.everyone);
        }
        case "recognitions":
          return metadata?.type === "recognition";
        case "images": {
          const images = metadata?.images as string[] | undefined;
          return images && images.length > 0;
        }
        default:
          return true;
      }
    });
  }, [posts, activeFilter]);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold mb-1">Mural</h1>
            <p className="text-muted-foreground text-sm">
              Veja o que está acontecendo na empresa em um olhar
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((f) => (
            <Button
              key={f.key}
              variant={activeFilter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(f.key)}
              className={cn(
                "gap-1.5 rounded-full transition-all",
                activeFilter === f.key && "shadow-md"
              )}
            >
              {f.icon}
              {f.label}
            </Button>
          ))}
        </div>

        {/* Create post — fixed above grid */}
        <CreatePost />

        {/* Masonry grid */}
        {isLoading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="break-inside-avoid mb-4">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-7 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-4">😕</div>
              <h3 className="text-lg font-semibold text-foreground">Erro ao carregar posts</h3>
              <p className="text-sm text-muted-foreground mt-1">Tente recarregar a página</p>
            </CardContent>
          </Card>
        ) : filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-4">{activeFilter === "all" ? "📝" : "🔍"}</div>
              <h3 className="text-lg font-semibold text-foreground">
                {activeFilter === "all" ? "Nenhum post ainda" : "Nenhum resultado"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {activeFilter === "all"
                  ? "Seja o primeiro a compartilhar algo com a equipe!"
                  : "Nenhum post corresponde a esse filtro."}
              </p>
              {activeFilter !== "all" && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setActiveFilter("all")}>
                  Limpar filtro
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {/* Trending Topics widget card */}
            <Card className="break-inside-avoid mb-4 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Em Alta</h3>
                </div>
                {loadingTrending ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-12" />
                      </div>
                    ))}
                  </div>
                ) : trendingTopics && trendingTopics.length > 0 ? (
                  <div className="space-y-1.5">
                    {trendingTopics.map((topic) => (
                      <div key={topic.name} className="flex items-center justify-between py-1 hover:bg-secondary/50 -mx-1 px-1 rounded transition-colors">
                        <span className="text-sm font-medium text-primary">{topic.name}</span>
                        <Badge variant="secondary" className="text-xs">{topic.posts}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Use #hashtags nos posts para aparecer aqui</p>
                )}
              </CardContent>
            </Card>

            {/* Posts */}
            {filteredPosts.map((post) => (
              <FeedPost key={post.id} post={post} />
            ))}

            {/* Top Recognized widget card */}
            <Card className="break-inside-avoid mb-4 border-warning/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-4 w-4 text-warning" />
                  <h3 className="text-sm font-semibold">Destaque do Mês</h3>
                </div>
                {loadingTopRecognized ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-2.5 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : topRecognized && topRecognized.length > 0 ? (
                  <div className="space-y-2.5">
                    {topRecognized.map((user, index) => (
                      <div key={user.user_id} className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-warm text-white text-[10px] font-bold shrink-0">
                          {index + 1}
                        </span>
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{user.full_name || "Usuário"}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.recognitions_count} reconhecimento{user.recognitions_count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Nenhum reconhecimento este mês</p>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3 text-xs"
                  onClick={() => navigate("/recognition")}
                >
                  Ver todos →
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Feed;
