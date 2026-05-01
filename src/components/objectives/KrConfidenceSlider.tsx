import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface KrConfidenceSliderProps {
  keyResultId: string;
  value: number | null;
  canEdit: boolean;
  className?: string;
  compact?: boolean;
}

function colorFor(value: number | null): string {
  if (value == null) return "bg-muted text-muted-foreground border-muted";
  if (value > 70) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/40";
  if (value >= 30) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/40";
  return "bg-red-500/10 text-red-400 border-red-500/40";
}

export function KrConfidenceSlider({
  keyResultId,
  value,
  canEdit,
  className,
  compact = false,
}: KrConfidenceSliderProps) {
  const queryClient = useQueryClient();
  const [local, setLocal] = useState<number>(value ?? 50);
  const [touched, setTouched] = useState(value != null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value != null) {
      setLocal(value);
      setTouched(true);
    }
  }, [value]);

  const mutation = useMutation({
    mutationFn: async (next: number) => {
      const { error } = await supabase
        .from("key_results")
        .update({ confidence: next })
        .eq("id", keyResultId);
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
      queryClient.invalidateQueries({ queryKey: ["objectives-filtered"] });
      trackEvent("kr_confidence_updated", { key_result_id: keyResultId, confidence: next });
    },
    onError: (err: Error) => toast.error(`Erro ao atualizar confiança: ${err.message}`),
  });

  const handleChange = (vals: number[]) => {
    const next = vals[0] ?? 0;
    setLocal(next);
    setTouched(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      mutation.mutate(next);
    }, 500);
  };

  const display = touched ? local : null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant="outline" className={cn("text-[10px] shrink-0", colorFor(display))}>
        Confiança: {display != null ? `${display}%` : "—"}
      </Badge>
      {canEdit && (
        <Slider
          value={[local]}
          min={0}
          max={100}
          step={1}
          onValueChange={handleChange}
          className={cn(compact ? "w-24" : "w-40")}
          aria-label="Confiança do KR"
        />
      )}
    </div>
  );
}
