import { AppLayout } from "@/components/layout/AppLayout";
import { CreatePost } from "@/components/feed/CreatePost";
import { FeedPost } from "@/components/feed/FeedPost";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Award } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { useTopRecognized } from "@/hooks/useTopRecognized";
import { useTrendingTopics } from "@/hooks/useTrendingTopics";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const Feed = () => {
  const { data: posts, isLoading, error } = usePosts();
  const { data: topRecognized, isLoading: loadingTopRecognized } = useTopRecognized(3);
  const { data: trendingTopics, isLoading: loadingTrending } = useTrendingTopics(4);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Central Feed — narrower with generous margins */}
          <div className="max-w-2xl mx-auto w-full space-y-6">
            <div>
              <h1 className="text-2xl font-heading font-bold mb-1">Feed</h1>
              <p className="text-muted-foreground text-sm">
                Fique por dentro do que está acontecendo na empresa
              </p>
            </div>
            
            <CreatePost />

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader className="flex flex-row items-start gap-4 pb-2">
                      <Skeleton className="h-11 w-11 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-4xl mb-4">😕</div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Erro ao carregar posts
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tente recarregar a página
                  </p>
                </CardContent>
              </Card>
            ) : posts && posts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-4xl mb-4">📝</div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Nenhum post ainda
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Seja o primeiro a compartilhar algo com a equipe!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts?.map((post, index) => (
                  <div
                    key={post.id}
                    className="animate-slide-up opacity-0"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <FeedPost post={post} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar — Insights Panel */}
          <aside className="hidden lg:block space-y-0">
            <div className="floating-panel sticky top-20 p-0 overflow-hidden">
              {/* Panel Header */}
              <div className="px-5 py-4">
                <h2 className="text-sm font-heading font-semibold uppercase tracking-wider text-muted-foreground">
                  Insights
                </h2>
              </div>

              <Separator className="bg-border/40" />

              {/* Trending Topics Section */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Em Alta</h3>
                </div>
                <div className="space-y-2">
                  {loadingTrending ? (
                    [1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between py-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-5 w-14" />
                      </div>
                    ))
                  ) : trendingTopics && trendingTopics.length > 0 ? (
                    trendingTopics.map((topic) => (
                      <div
                        key={topic.name}
                        className="flex items-center justify-between cursor-pointer hover:bg-secondary/50 -mx-2 px-2 py-1.5 rounded-md transition-colors"
                      >
                        <span className="text-sm font-medium text-primary">{topic.name}</span>
                        <Badge variant="secondary" className="text-xs">{topic.posts}</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground py-2">
                      Use #hashtags nos posts para aparecer aqui
                    </p>
                  )}
                </div>
              </div>

              <Separator className="bg-border/40" />

              {/* Top Contributors Section */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-4 w-4 text-warning" />
                  <h3 className="text-sm font-semibold">Destaque do Mês</h3>
                </div>
                <div className="space-y-3">
                  {loadingTopRecognized ? (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-2.5 w-16" />
                        </div>
                      </div>
                    ))
                  ) : topRecognized && topRecognized.length > 0 ? (
                    topRecognized.map((user, index) => (
                      <div key={user.user_id} className="flex items-center gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-warm text-white text-[10px] font-bold">
                          {index + 1}
                        </span>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.full_name || "Usuário"}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.recognitions_count} reconhecimento{user.recognitions_count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground py-2">
                      Nenhum reconhecimento este mês
                    </p>
                  )}
                </div>
              </div>

              <Separator className="bg-border/40" />

              {/* Quick Stats Section */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Atividade</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-heading font-bold">{posts?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Posts esta semana</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
};

export default Feed;
