import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityItem } from "./ActivityItem";

const recentActivities = [
  {
    user: { name: "Ana Silva", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana" },
    action: "reconheceu",
    target: "Carlos Oliveira",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    type: "recognition" as const,
  },
  {
    user: { name: "Pedro Santos", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro" },
    action: "completou o objetivo",
    target: "Q1 Meta de Vendas",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    type: "objective" as const,
  },
  {
    user: { name: "Maria Costa", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria" },
    action: "publicou uma atualização no feed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    type: "post" as const,
  },
  {
    user: { name: "João Lima", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Joao" },
    action: "respondeu a pesquisa",
    target: "Clima Organizacional",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
    type: "survey" as const,
  },
  {
    user: { name: "Beatriz Ferreira", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Beatriz" },
    action: "reconheceu",
    target: "Equipe de Produto",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    type: "recognition" as const,
  },
];

export function RecentActivity() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-heading">Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {recentActivities.map((activity, index) => (
          <ActivityItem key={index} {...activity} />
        ))}
      </CardContent>
    </Card>
  );
}
