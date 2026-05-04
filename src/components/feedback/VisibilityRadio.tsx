import { Lock, Eye, Network } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import type { FeedbackVisibility } from "@/lib/validation/feedbackRequestSchema";

interface VisibilityRadioProps {
  value: FeedbackVisibility;
  onChange: (v: FeedbackVisibility) => void;
}

const OPTIONS: Array<{
  value: FeedbackVisibility;
  icon: typeof Lock;
  title: string;
  description: string;
}> = [
  {
    value: "private_requester",
    icon: Lock,
    title: "Privado (só para você)",
    description: "A resposta fica apenas com você (e o respondente). A pessoa avaliada não vê.",
  },
  {
    value: "shared_with_subject",
    icon: Eye,
    title: "Compartilhado com a pessoa avaliada",
    description: "A pessoa sobre quem é o feedback recebe a resposta após enviada.",
  },
  {
    value: "shared_with_manager",
    icon: Network,
    title: "Compartilhado com a pessoa + gestor dela",
    description: "Pessoa avaliada e o gestor direto também veem (precisa hierarquia configurada).",
  },
];

export function VisibilityRadio({ value, onChange }: VisibilityRadioProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as FeedbackVisibility)}
      className="grid gap-2"
    >
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <Label
            key={opt.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors",
              "hover:bg-accent",
              active && "border-primary bg-primary/5",
            )}
          >
            <RadioGroupItem value={opt.value} className="mt-1" />
            <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
            <div className="flex-1">
              <p className="text-sm font-medium leading-tight">{opt.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{opt.description}</p>
            </div>
          </Label>
        );
      })}
    </RadioGroup>
  );
}
