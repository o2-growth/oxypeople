import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronRight, Target, Calendar } from "lucide-react";
import { useState } from "react";
import { KeyResultItem, KeyResult } from "./KeyResultItem";

export interface Objective {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: "on-track" | "at-risk" | "off-track";
  dueDate: string;
  owner: {
    name: string;
    avatar: string;
    initials: string;
  };
  keyResults: KeyResult[];
  visibility: "personal" | "team" | "company";
}

interface ObjectiveCardProps {
  objective: Objective;
}

const statusConfig = {
  "on-track": { label: "No Prazo", className: "bg-green-500/10 text-green-600 border-green-500/30" },
  "at-risk": { label: "Em Risco", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
  "off-track": { label: "Atrasado", className: "bg-red-500/10 text-red-600 border-red-500/30" },
};

const visibilityConfig = {
  personal: { label: "Pessoal", className: "bg-blue-500/10 text-blue-600" },
  team: { label: "Equipe", className: "bg-purple-500/10 text-purple-600" },
  company: { label: "Empresa", className: "bg-teal-500/10 text-teal-600" },
};

export function ObjectiveCard({ objective }: ObjectiveCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const status = statusConfig[objective.status];
  const visibility = visibilityConfig[objective.visibility];

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
              <Badge variant="secondary" className={visibility.className}>
                {visibility.label}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg text-foreground">{objective.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{objective.description}</p>
          </div>
          
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={objective.owner.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {objective.owner.initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium text-foreground">{objective.progress}%</span>
          </div>
          <Progress value={objective.progress} className="h-2" />
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{objective.dueDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target className="h-4 w-4" />
            <span>{objective.keyResults.length} Key Results</span>
          </div>
        </div>

        {/* Key Results Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:underline w-full"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          {isExpanded ? "Ocultar" : "Ver"} Key Results
        </button>

        {/* Key Results List */}
        {isExpanded && (
          <div className="space-y-3 pt-2 border-t">
            {objective.keyResults.map((kr) => (
              <KeyResultItem key={kr.id} keyResult={kr} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
