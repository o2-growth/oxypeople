import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Users, Trophy, Target, TrendingUp, MessageSquare, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const stats = [
  {
    title: "Total de Colaboradores",
    value: 248,
    change: 12,
    changeLabel: "este mês",
    icon: <Users className="h-6 w-6" />,
    colorClass: "bg-gradient-primary",
  },
  {
    title: "Reconhecimentos",
    value: 156,
    change: 24,
    changeLabel: "vs último mês",
    icon: <Trophy className="h-6 w-6" />,
    colorClass: "bg-gradient-accent",
  },
  {
    title: "Objetivos Concluídos",
    value: "78%",
    change: 8,
    changeLabel: "vs último trimestre",
    icon: <Target className="h-6 w-6" />,
    colorClass: "bg-gradient-warm",
  },
  {
    title: "Engajamento",
    value: "92%",
    change: 5,
    changeLabel: "vs último mês",
    icon: <TrendingUp className="h-6 w-6" />,
    colorClass: "bg-gradient-success",
  },
];

const quickStats = [
  { label: "Posts hoje", value: 23, icon: <MessageSquare className="h-4 w-4" /> },
  { label: "Tarefas concluídas", value: 45, icon: <CheckCircle2 className="h-4 w-4" /> },
];

const Index = () => {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-bold tracking-tight">
            Bom dia! 👋
          </h1>
          <p className="text-muted-foreground">
            Aqui está um resumo do que está acontecendo na sua empresa.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.title}
              className="animate-slide-up opacity-0"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <StatCard {...stat} />
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Activity Feed */}
          <div className="lg:col-span-2">
            <RecentActivity />
          </div>

          {/* Quick Stats & Goals */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-heading">Hoje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quickStats.map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                        {stat.icon}
                      </div>
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                    </div>
                    <span className="text-xl font-bold">{stat.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Goals Progress */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-heading">Metas do Trimestre</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Vendas</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Satisfação do Cliente</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Retenção de Talentos</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
