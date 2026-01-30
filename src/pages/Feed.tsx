import { AppLayout } from "@/components/layout/AppLayout";
import { CreatePost } from "@/components/feed/CreatePost";
import { FeedPost } from "@/components/feed/FeedPost";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Award } from "lucide-react";

const feedPosts = [
  {
    author: {
      name: "Ana Silva",
      role: "Head de Produto",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
    },
    content: "Super orgulhosa do nosso time! Conseguimos entregar a nova feature 2 semanas antes do prazo. O comprometimento de todos foi incrível. 🚀",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    likes: 24,
    comments: 8,
    isRecognition: true,
    recognitionTo: "Equipe de Produto",
  },
  {
    author: {
      name: "Carlos Oliveira",
      role: "Desenvolvedor Sênior",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
    },
    content: "Ontem participei do workshop de liderança e foi transformador! Recomendo muito para quem quer desenvolver suas soft skills. Obrigado @RH pela organização!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    likes: 18,
    comments: 5,
  },
  {
    author: {
      name: "Maria Costa",
      role: "UX Designer",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
    },
    content: "Finalizamos os testes de usabilidade do novo dashboard! Os resultados foram muito positivos - 95% de satisfação. Mal posso esperar para lançar para todos vocês! 🎨✨",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    likes: 32,
    comments: 12,
  },
  {
    author: {
      name: "Pedro Santos",
      role: "Gerente de Vendas",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro",
    },
    content: "Batemos a meta do mês com 3 dias de antecedência! 🎯 Time comercial, vocês são demais!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    likes: 45,
    comments: 15,
    isRecognition: true,
    recognitionTo: "Time Comercial",
  },
];

const trendingTopics = [
  { name: "#workshop-lideranca", posts: 23 },
  { name: "#meta-batida", posts: 18 },
  { name: "#novo-produto", posts: 15 },
  { name: "#aniversariantes", posts: 12 },
];

const topContributors = [
  { name: "Ana Silva", recognitions: 15, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana" },
  { name: "Carlos Oliveira", recognitions: 12, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos" },
  { name: "Maria Costa", recognitions: 10, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria" },
];

const Feed = () => {
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

              <div className="space-y-4">
                {feedPosts.map((post, index) => (
                  <div
                    key={index}
                    className="animate-slide-up opacity-0"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <FeedPost {...post} />
                  </div>
                ))}
              </div>
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
                  {topContributors.map((contributor, index) => (
                    <div
                      key={contributor.name}
                      className="flex items-center gap-3"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-warm text-white text-xs font-bold">
                        {index + 1}
                      </span>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={contributor.avatar} />
                        <AvatarFallback>{contributor.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{contributor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {contributor.recognitions} reconhecimentos
                        </p>
                      </div>
                    </div>
                  ))}
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
                      <p className="text-white/80 text-sm">Colaboradores ativos</p>
                      <p className="text-2xl font-heading font-bold">248</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/70">
                    89% de engajamento no feed esta semana
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
