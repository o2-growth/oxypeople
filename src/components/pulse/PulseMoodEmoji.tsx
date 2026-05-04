import { cn } from "@/lib/utils";

interface PulseMoodEmojiProps {
  selected: number | null;
  onSelect: (score: number, emoji: string) => void;
  disabled?: boolean;
}

const MOODS = [
  { score: 1, emoji: "😢", label: "Muito mal" },
  { score: 2, emoji: "😐", label: "Mal" },
  { score: 3, emoji: "🙂", label: "Ok" },
  { score: 4, emoji: "😀", label: "Bem" },
  { score: 5, emoji: "😍", label: "Ótimo" },
];

export function PulseMoodEmoji({ selected, onSelect, disabled }: PulseMoodEmojiProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {MOODS.map((m) => {
        const active = selected === m.score;
        return (
          <button
            key={m.score}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(m.score, m.emoji)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-md border p-2 text-center transition-all",
              "hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
              active && "border-primary bg-primary/10 ring-2 ring-primary scale-105",
            )}
          >
            <span className="text-3xl leading-none">{m.emoji}</span>
            <span className="text-[10px] text-muted-foreground">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
