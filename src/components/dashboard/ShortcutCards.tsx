import { useNavigate } from "react-router-dom";
import { Users, ExternalLink } from "lucide-react";

export function ShortcutCards() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Com quem eu falo? */}
      <button
        onClick={() => navigate("/people")}
        className="group flex items-center gap-4 rounded-2xl border border-border/40 bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 text-left"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Com quem eu falo?</p>
          <p className="text-xs text-muted-foreground">Veja o organograma da empresa</p>
        </div>
      </button>

      {/* Enxoval O2 */}
      <a
        href="https://notion.so"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-4 rounded-2xl border border-border/40 bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 text-left"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-warning to-warning/70 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
          <ExternalLink className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Enxoval O2</p>
          <p className="text-xs text-muted-foreground">Acesse documentos e guias</p>
        </div>
      </a>
    </div>
  );
}
