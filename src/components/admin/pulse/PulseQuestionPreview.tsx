import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import type { PulseQuestionType } from "@/lib/validation/pulseSurveySchema";

interface PulseQuestionPreviewProps {
  question: string;
  questionType: PulseQuestionType;
}

const MOOD_EMOJIS = ["😢", "😐", "🙂", "😀", "😍"];

export function PulseQuestionPreview({ question, questionType }: PulseQuestionPreviewProps) {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-muted-foreground">
          Pré-visualização (como o respondente vê)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-base font-medium">
          {question || "Sua pergunta aparece aqui."}
        </p>
        {questionType === "scale_1_5" && (
          <div className="flex items-center justify-between gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                disabled
                className="flex h-10 w-10 items-center justify-center rounded-full border bg-background text-sm font-medium opacity-70"
              >
                {n}
              </button>
            ))}
          </div>
        )}
        {questionType === "enps_0_10" && (
          <div>
            <Slider value={[7]} min={0} max={10} step={1} disabled />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>0 — Pouco provável</span>
              <span>10 — Muito provável</span>
            </div>
          </div>
        )}
        {questionType === "mood_emoji" && (
          <div className="flex items-center justify-between gap-1 text-3xl">
            {MOOD_EMOJIS.map((e, i) => (
              <button
                key={i}
                type="button"
                disabled
                className="flex h-12 w-12 items-center justify-center rounded-full opacity-70"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
