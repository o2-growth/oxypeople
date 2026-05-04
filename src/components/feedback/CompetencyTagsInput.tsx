import { useState, type KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CompetencyTagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
}

const SUGGESTIONS = [
  "Comunicação",
  "Liderança",
  "Colaboração",
  "Entrega",
  "Proatividade",
  "Aprendizado",
  "Visão estratégica",
  "Tomada de decisão",
];

export function CompetencyTagsInput({ value, onChange, max = 10 }: CompetencyTagsInputProps) {
  const [draft, setDraft] = useState("");

  const add = (tag: string) => {
    const clean = tag.trim().slice(0, 80);
    if (!clean) return;
    if (value.includes(clean)) return;
    if (value.length >= max) return;
    onChange([...value, clean]);
    setDraft("");
  };

  const remove = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    }
  };

  const remaining = SUGGESTIONS.filter((s) => !value.includes(s));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {value.length === 0 && (
          <span className="text-xs text-muted-foreground py-1">
            Nenhuma competência marcada (opcional).
          </span>
        )}
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pl-2 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="rounded-full p-0.5 hover:bg-background/50"
              aria-label={`Remover ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-1.5">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Digite e Enter para adicionar"
          className="h-8 text-sm"
          disabled={value.length >= max}
          maxLength={80}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => add(draft)}
          disabled={!draft.trim() || value.length >= max}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {remaining.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {remaining.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              disabled={value.length >= max}
              className="rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-40"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
