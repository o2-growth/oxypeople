import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LIKERT_OPTIONS } from "./GPTWQuestions";
import { cn } from "@/lib/utils";

interface LikertScaleProps {
  questionId: string;
  questionText: string;
  value: number | undefined;
  onChange: (questionId: string, value: number) => void;
  index?: number;
}

export function LikertScale({ questionId, questionText, value, onChange, index }: LikertScaleProps) {
  return (
    <div className="space-y-3 p-4 rounded-lg border bg-card">
      <p className="text-sm font-medium leading-relaxed">
        {index !== undefined && <span className="text-muted-foreground mr-1">{index}.</span>}
        {questionText}
      </p>
      <RadioGroup
        value={value?.toString()}
        onValueChange={(v) => onChange(questionId, parseInt(v))}
        className="flex flex-wrap gap-2"
      >
        {LIKERT_OPTIONS.map((opt) => (
          <div key={opt.value} className="flex items-center">
            <RadioGroupItem
              value={opt.value.toString()}
              id={`${questionId}-${opt.value}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`${questionId}-${opt.value}`}
              className={cn(
                "cursor-pointer rounded-lg border px-3 py-2 text-xs transition-all",
                "hover:bg-accent hover:text-accent-foreground",
                value === opt.value
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border bg-background text-muted-foreground"
              )}
            >
              {opt.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
