import { NineBoxCell } from "./NineBoxCell";
import type { NineBoxPlacement } from "@/hooks/useNineBoxSnapshot";

interface NineBoxGridProps {
  placements: NineBoxPlacement[];
  disabled: boolean;
  onRemove: (placementId: string) => void;
}

/**
 * Renderiza grid 3×3 com:
 * - Eixo X (esquerda → direita) = Performance: 1 (baixa) → 3 (alta)
 * - Eixo Y (baixo → cima) = Potencial: 1 (baixo) → 3 (alto)
 * Para layout CSS, renderizamos top-down (potential decrescente).
 */
export function NineBoxGrid({ placements, disabled, onRemove }: NineBoxGridProps) {
  const byCell = new Map<string, NineBoxPlacement[]>();
  placements.forEach((p) => {
    const key = `${p.performance_axis},${p.potential_axis}`;
    const arr = byCell.get(key) ?? [];
    arr.push(p);
    byCell.set(key, arr);
  });

  // Linhas: potencial 3 (topo), 2, 1 (base)
  const rows = [3, 2, 1];
  const cols = [1, 2, 3];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[24px_1fr_1fr_1fr] gap-2">
        <div />
        <div className="text-center text-xs font-medium text-muted-foreground">
          Performance baixa
        </div>
        <div className="text-center text-xs font-medium text-muted-foreground">
          Performance média
        </div>
        <div className="text-center text-xs font-medium text-muted-foreground">
          Performance alta
        </div>

        {rows.map((pot) => (
          <div key={`row-${pot}`} className="contents">
            <div className="flex items-center justify-center text-xs font-medium text-muted-foreground -rotate-90 whitespace-nowrap">
              {pot === 3 ? "Pot. alto" : pot === 2 ? "Pot. médio" : "Pot. baixo"}
            </div>
            {cols.map((perf) => {
              const cellPlacements = byCell.get(`${perf},${pot}`) ?? [];
              return (
                <NineBoxCell
                  key={`${perf}-${pot}`}
                  performance={perf}
                  potential={pot}
                  placements={cellPlacements}
                  disabled={disabled}
                  onRemove={onRemove}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
