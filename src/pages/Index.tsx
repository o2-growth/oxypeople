import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Users, Trophy, Target, TrendingUp, MessageSquare, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useQuarterGoals } from "@/hooks/useQuarterGoals";
import { useUser } from "@/hooks/useUser";

const Index = () => {
  const { profile, isLoading: isLoadingUser } = useUser();
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats();
  const { data: quarterGoals, isLoading: isLoadingGoals } = useQuarterGoals();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const userName = profile?.full_name?.split(" ")[0] || "";

  const statsData = [
    {
      title: "Total de Colaboradores",
      value: stats?.totalCollaborators || 0,
      change: stats?.collaboratorsChange || 0,
      changeLabel: "este mês",
      icon: <Users className="h-6 w-6" />,
      colorClass: "bg-gradient-primary",
    },
    {
      title: "Reconhecimentos",
      value: stats?.recognitionsThisMonth || 0,
      change: stats?.recognitionsChange || 0,
      changeLabel: "vs último mês",
      icon: <Trophy className="h-6 w-6" />,
      colorClass: "bg-gradient-accent",
    },
    {
      title: "Objetivos Concluídos",
      value: `${stats?.objectivesCompletionRate || 0}%`,
      change: stats?.objectivesChange || 0,
      changeLabel: "vs último trimestre",
      icon: <Target className="h-6 w-6" />,
      colorClass: "bg-gradient-warm",
    },
    {
      title: "Engajamento",
      value: `${stats?.engagementRate || 0}%`,
      change: stats?.engagementChange || 0,
      changeLabel: "vs último mês",
      icon: <TrendingUp className="h-6 w-6" />,
      colorClass: "bg-gradient-success",
    },
  ];

  const quickStatsData = [
    { label: "Posts hoje", value: stats?.postsToday || 0, icon: <MessageSquare className="h-4 w-4" /> },
    { label: "Objetivos concluídos", value: stats?.completedObjectivesToday || 0, icon: <CheckCircle2 className="h-4 w-4" /> },
  ];

  const isLoading = isLoadingStats || isLoadingUser;

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="space-y-1">
          <h1 className="text-3xl font-heading font-bold tracking-tight">
            {getGreeting()}{userName ? `, ${userName}` : ""}! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Aqui está um resumo do que está acontecendo na sua empresa.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="stat-card">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
              </div>
            ))
          ) : (
            statsData.map((stat, index) => (
              <div
                key={stat.title}
                className="animate-slide-up opacity-0"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <StatCard {...stat} />
              </div>
            ))
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Activity Feed */}
          <div>
            <RecentActivity />
          </div>

          {/* Right Insights Panel */}
          <aside className="hidden lg:block">
            <div className="floating-panel sticky top-20 p-0 overflow-hidden">
              {/* Panel Header */}
              <div className="px-5 py-4">
                <h2 className="text-sm font-heading font-semibold uppercase tracking-wider text-muted-foreground">
                  Insights
                </h2>
              </div>

              <Separator className="bg-border/40" />

              {/* Quick Stats Section */}
              <div className="px-5 py-4">
                <h3 className="text-sm font-semibold mb-3">Hoje</h3>
                <div className="space-y-3">
                  {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-lg" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-5 w-8" />
                      </div>
                    ))
                  ) : (
                    quickStatsData.map((stat) => (
                      <div key={stat.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                            {stat.icon}
                          </div>
                          <span className="text-sm text-muted-foreground">{stat.label}</span>
                        </div>
                        <span className="text-lg font-bold">{stat.value}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Separator className="bg-border/40" />

              {/* Goals Progress Section */}
              <div className="px-5 py-4">
                <h3 className="text-sm font-semibold mb-3">Metas do Trimestre</h3>
                <div className="space-y-3">
                  {isLoadingGoals ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-8" />
                        </div>
                        <Skeleton className="h-1.5 w-full" />
                      </div>
                    ))
                  ) : quarterGoals && quarterGoals.length > 0 ? (
                    quarterGoals.map((goal) => (
                      <div key={goal.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground text-xs">{goal.label}</span>
                          <span className="font-medium text-xs">{goal.value}%</span>
                        </div>
                        <Progress value={goal.value} className="h-1.5" />
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground py-2">
                      Nenhum objetivo ativo
                    </p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
