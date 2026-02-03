import { AppLayout } from "@/components/layout/AppLayout";
import { CreatePost } from "@/components/feed/CreatePost";
import { FeedPost } from "@/components/feed/FeedPost";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Award, Loader2 } from "lucide-react";
import { usePosts } from "@/hooks/usePosts";
import { useTopRecognized } from "@/hooks/useTopRecognized";
import { Skeleton } from "@/components/ui/skeleton";

const trendingTopics = [
  { name: "#workshop-lideranca", posts: 23 },
  { name: "#meta-batida", posts: 18 },
  { name: "#novo-produto", posts: 15 },
  { name: "#aniversariantes", posts: 12 },
];

const Feed = () => {
  const { data: posts, isLoading, error } = usePosts();
  const { data: topRecognized, isLoading: loadingTopRecognized } = useTopRecognized(3);

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
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Feed */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-2xl font-heading font-bold mb-1">Feed</h1>
                <p className="text-muted-foreground">
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

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Trending Topics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-heading">
                    <TrendingUp className="h-5 w-5 text-accent" />
                    Em Alta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trendingTopics.map((topic) => (
                    <div
                      key={topic.name}
                      className="flex items-center justify-between cursor-pointer hover:bg-secondary/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                    >
                      <span className="font-medium text-primary">{topic.name}</span>
                      <Badge variant="secondary">{topic.posts} posts</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Top Contributors */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-heading">
                    <Award className="h-5 w-5 text-warning" />
                    Destaque do Mês
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadingTopRecognized ? (
                    <>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-20" />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : topRecognized && topRecognized.length > 0 ? (
                    topRecognized.map((user, index) => (
                      <div
                        key={user.user_id}
                        className="flex items-center gap-3"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-warm text-white text-xs font-bold">
                          {index + 1}
                        </span>
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
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
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">Nenhum reconhecimento este mês</p>
                      <p className="text-xs mt-1">Seja o primeiro a reconhecer um colega!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-gradient-hero text-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-white/80 text-sm">Posts esta semana</p>
                      <p className="text-2xl font-heading font-bold">{posts?.length || 0}</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/70">
                    Continue engajado com sua equipe!
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Feed;
