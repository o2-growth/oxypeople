import { AppLayout } from "@/components/layout/AppLayout";
import { RecognitionCard } from "@/components/recognition/RecognitionCard";
import { SendRecognition } from "@/components/recognition/SendRecognition";
import { Leaderboard } from "@/components/recognition/Leaderboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Send, Inbox } from "lucide-react";

const mockRecognitions = [
  {
    id: "1",
    fromUser: { name: "Carlos Santos", avatar: "", initials: "CS" },
    toUser: { name: "Ana Silva", avatar: "", initials: "AS" },
    message: "Excelente trabalho na apresentação do projeto! Sua dedicação e criatividade fizeram toda a diferença.",
    badge: { name: "Excelência", icon: "🏆", color: "#ef4444" },
    points: 25,
    createdAt: "Há 2 horas",
    likes: 12,
    comments: 3,
  },
  {
    id: "2",
    fromUser: { name: "Maria Oliveira", avatar: "", initials: "MO" },
    toUser: { name: "João Pereira", avatar: "", initials: "JP" },
    message: "Obrigada por me ajudar a resolver aquele problema complexo. Sua paciência e conhecimento técnico são inspiradores!",
    badge: { name: "Colaboração", icon: "🤝", color: "#10b981" },
    points: 10,
    createdAt: "Há 5 horas",
    likes: 8,
    comments: 2,
  },
  {
    id: "3",
    fromUser: { name: "Fernanda Lima", avatar: "", initials: "FL" },
    toUser: { name: "Carlos Santos", avatar: "", initials: "CS" },
    message: "Sua ideia para automatizar o processo de relatórios foi brilhante! Economizou horas de trabalho para toda a equipe.",
    badge: { name: "Inovação", icon: "💡", color: "#f59e0b" },
    points: 15,
    createdAt: "Ontem",
    likes: 15,
    comments: 5,
  },
  {
    id: "4",
    fromUser: { name: "Ana Silva", avatar: "", initials: "AS" },
    toUser: { name: "Maria Oliveira", avatar: "", initials: "MO" },
    message: "Você liderou o projeto com maestria! Inspirou toda a equipe a dar o seu melhor.",
    badge: { name: "Liderança", icon: "🌟", color: "#8b5cf6" },
    points: 20,
    createdAt: "2 dias atrás",
    likes: 20,
    comments: 7,
  },
];

export default function Recognition() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Reconhecimentos</h1>
          <p className="text-muted-foreground mt-1">
            Celebre as conquistas e reconheça seus colegas
          </p>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Feed de Reconhecimentos */}
          <div className="lg:col-span-2 space-y-6">
            <SendRecognition />
            
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" className="gap-2">
                  <Trophy className="h-4 w-4" />
                  Todos
                </TabsTrigger>
                <TabsTrigger value="received" className="gap-2">
                  <Inbox className="h-4 w-4" />
                  Recebidos
                </TabsTrigger>
                <TabsTrigger value="sent" className="gap-2">
                  <Send className="h-4 w-4" />
                  Enviados
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-6 space-y-4">
                {mockRecognitions.map((recognition) => (
                  <RecognitionCard key={recognition.id} {...recognition} />
                ))}
              </TabsContent>
              
              <TabsContent value="received" className="mt-6 space-y-4">
                {mockRecognitions.slice(0, 2).map((recognition) => (
                  <RecognitionCard key={recognition.id} {...recognition} />
                ))}
              </TabsContent>
              
              <TabsContent value="sent" className="mt-6 space-y-4">
                {mockRecognitions.slice(2).map((recognition) => (
                  <RecognitionCard key={recognition.id} {...recognition} />
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Leaderboard />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
