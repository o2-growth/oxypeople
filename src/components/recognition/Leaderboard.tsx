import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

const leaderboardData = [
  { id: "1", name: "Ana Silva", initials: "AS", points: 450, recognitions: 23, position: 1 },
  { id: "2", name: "Carlos Santos", initials: "CS", points: 380, recognitions: 19, position: 2 },
  { id: "3", name: "Maria Oliveira", initials: "MO", points: 320, recognitions: 16, position: 3 },
  { id: "4", name: "João Pereira", initials: "JP", points: 280, recognitions: 14, position: 4 },
  { id: "5", name: "Fernanda Lima", initials: "FL", points: 240, recognitions: 12, position: 5 },
];

function getPositionIcon(position: number) {
  switch (position) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{position}</span>;
  }
}

function getPositionStyle(position: number) {
  switch (position) {
    case 1:
      return "bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border-yellow-500/30";
    case 2:
      return "bg-gradient-to-r from-gray-400/10 to-gray-400/5 border-gray-400/30";
    case 3:
      return "bg-gradient-to-r from-amber-600/10 to-amber-600/5 border-amber-600/30";
    default:
      return "";
  }
}

export function Leaderboard() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Ranking do Mês
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {leaderboardData.map((user) => (
          <div
            key={user.id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm ${getPositionStyle(user.position)}`}
          >
            <div className="flex items-center justify-center w-8">
              {getPositionIcon(user.position)}
            </div>
            
            <Avatar className="h-10 w-10">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {user.initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.recognitions} reconhecimentos</p>
            </div>
            
            <Badge variant="secondary" className="font-bold">
              {user.points} pts
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
