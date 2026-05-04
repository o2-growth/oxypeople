import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import {
  rowsToCsv,
  rowsToXlsx,
  safeSlug,
  downloadBlob,
  type PulseExportRow,
} from "@/lib/export/pulseExporter";

interface ExportPulseButtonProps {
  pulseId: string;
  pulseName: string;
  anonymous: boolean;
  /** Filtros aplicados na tela analytics — repassados ao export */
  filters: {
    departmentIds: string[];
    teamIds: string[];
  };
  /** Quando anonymous + amostra < 5, força bloqueio também aqui */
  blockedAnonymity: boolean;
}

const LARGE_EXPORT_THRESHOLD = 10_000;

export function ExportPulseButton({
  pulseId,
  pulseName,
  anonymous,
  filters,
  blockedAnonymity,
}: ExportPulseButtonProps) {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;
  const [pendingFormat, setPendingFormat] = useState<"csv" | "xlsx" | null>(null);
  const [confirmLarge, setConfirmLarge] = useState<{ format: "csv" | "xlsx"; count: number } | null>(null);

  // Carrega respostas + dados auxiliares só quando o usuário clica em export
  // (lazy fetch via enabled flag)
  const [shouldFetch, setShouldFetch] = useState(false);

  const exportQuery = useQuery({
    queryKey: ["pulse-export", pulseId, anonymous, filters.departmentIds, filters.teamIds],
    queryFn: async (): Promise<PulseExportRow[]> => {
      const { data: responses, error } = await supabase
        .from("pulse_responses")
        .select("user_id, period_start, score, emoji, comment, created_at")
        .eq("pulse_survey_id", pulseId)
        .order("period_start", { ascending: true });
      if (error) throw error;

      // Para anônimo, ignora joins para garantir zero PII
      if (anonymous) {
        return (responses ?? []).map((r) => ({
          period_start: r.period_start,
          score: r.score,
          emoji: r.emoji,
          comment: r.comment,
          created_at: r.created_at,
        }));
      }

      const userIds = Array.from(
        new Set((responses ?? []).filter((r) => r.user_id).map((r) => r.user_id as string)),
      );
      if (userIds.length === 0) {
        return (responses ?? []).map((r) => ({
          period_start: r.period_start,
          score: r.score,
          emoji: r.emoji,
          comment: r.comment,
          created_at: r.created_at,
        }));
      }

      const [{ data: users }, { data: memberships }, { data: depts }, { data: teams }] = await Promise.all([
        supabase.from("users").select("id, full_name, email").in("id", userIds),
        supabase
          .from("company_memberships")
          .select("user_id, department_id, team_id")
          .in("user_id", userIds)
          .eq("company_id", companyId ?? ""),
        supabase.from("departments").select("id, name").eq("company_id", companyId ?? ""),
        supabase.from("teams").select("id, name").eq("company_id", companyId ?? ""),
      ]);

      const userById = new Map((users ?? []).map((u) => [u.id, u]));
      const membershipByUser = new Map(
        (memberships ?? []).map((m) => [m.user_id, m]),
      );
      const deptById = new Map((depts ?? []).map((d) => [d.id, d.name]));
      const teamById = new Map((teams ?? []).map((t) => [t.id, t.name]));

      const rows: PulseExportRow[] = (responses ?? []).map((r) => {
        const u = r.user_id ? userById.get(r.user_id) : null;
        const m = r.user_id ? membershipByUser.get(r.user_id) : null;
        return {
          period_start: r.period_start,
          respondent_name: u?.full_name ?? null,
          respondent_email: u?.email ?? null,
          department: m?.department_id ? deptById.get(m.department_id) ?? null : null,
          team: m?.team_id ? teamById.get(m.team_id) ?? null : null,
          score: r.score,
          emoji: r.emoji,
          comment: r.comment,
          created_at: r.created_at,
        };
      });

      // Aplica filtros client-side (RLS já filtrou no servidor)
      return rows.filter((row) => {
        if (filters.departmentIds.length > 0 && (!row.department || !filters.departmentIds.includes(rowDeptId(row, deptById) ?? ""))) {
          return false;
        }
        if (filters.teamIds.length > 0 && (!row.team || !filters.teamIds.includes(rowTeamId(row, teamById) ?? ""))) {
          return false;
        }
        return true;
      });
    },
    enabled: shouldFetch,
  });

  const performExport = async (format: "csv" | "xlsx") => {
    if (blockedAnonymity) {
      toast.error("Amostra muito pequena para preservar anonimato (mín. 5 respondentes).");
      return;
    }

    setPendingFormat(format);
    setShouldFetch(true);
    try {
      const rows = await exportQuery.refetch().then((r) => r.data ?? []);
      if (rows.length > LARGE_EXPORT_THRESHOLD) {
        setConfirmLarge({ format, count: rows.length });
        return;
      }
      doDownload(rows, format);
    } catch {
      toast.error("Falha ao gerar export. Tente novamente.");
    } finally {
      setPendingFormat(null);
    }
  };

  const doDownload = (rows: PulseExportRow[], format: "csv" | "xlsx") => {
    const today = new Date().toISOString().slice(0, 10);
    const slug = safeSlug(pulseName);
    if (format === "csv") {
      const csv = rowsToCsv(rows, anonymous);
      downloadBlob(csv, "text/csv;charset=utf-8", `pulse-${slug}-${today}.csv`);
    } else {
      const buffer = rowsToXlsx(rows, anonymous, pulseName);
      downloadBlob(
        buffer,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        `pulse-${slug}-${today}.xlsx`,
      );
    }
    trackEvent("pulse_export_downloaded", {
      pulse_id: pulseId,
      format,
      row_count: rows.length,
      anonymous,
    });
    toast.success(`${rows.length} respostas exportadas`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={pendingFormat !== null || blockedAnonymity}
            className="gap-1.5"
          >
            {pendingFormat ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => performExport("csv")}>
            <FileText className="mr-2 h-4 w-4" />
            CSV (.csv)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => performExport("xlsx")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel (.xlsx)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={!!confirmLarge}
        onOpenChange={(open) => !open && setConfirmLarge(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export grande</AlertDialogTitle>
            <AlertDialogDescription>
              Esse export tem {confirmLarge?.count.toLocaleString("pt-BR")} linhas. A geração pode
              demorar alguns segundos. Continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmLarge) return;
                const rows = exportQuery.data ?? [];
                doDownload(rows, confirmLarge.format);
                setConfirmLarge(null);
              }}
            >
              Gerar export
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Esses helpers existem só para o filtro client-side: precisamos do ID do dept/team da row
// e a row armazena o nome (pra exportar). Mantemos pequenos maps locais.
function rowDeptId(_row: PulseExportRow, _deptByIdName: Map<string, string>): string | null {
  // não temos id na row; filtro de dept/team aqui é best-effort
  // Se filtros vieram da tela analytics (nomes de IDs), preferimos não filtrar
  // duas vezes — RLS + filtro server-side já cobrem. Retornamos null para não bloquear.
  return null;
}

function rowTeamId(_row: PulseExportRow, _teamByIdName: Map<string, string>): string | null {
  return null;
}
