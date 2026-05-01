import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Settings2, Save, CalendarRange, ArrowRight, Siren, Network } from "lucide-react";
import { Link } from "react-router-dom";
import { useOkrSettings, useUpdateOkrSettings } from "@/hooks/useCheckins";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { toast } from "sonner";

export function OkrSettingsPanel() {
  const { data: settings, isLoading } = useOkrSettings();
  const updateSettings = useUpdateOkrSettings();
  const { isAdmin } = useUserPermissions();

  const [frequency, setFrequency] = useState("weekly");
  const [minChars, setMinChars] = useState(20);
  const [deviationAttention, setDeviationAttention] = useState(10);
  const [deviationRisk, setDeviationRisk] = useState(25);
  const [overdueDays, setOverdueDays] = useState(7);
  const [riskEscalationDays, setRiskEscalationDays] = useState(3);

  useEffect(() => {
    if (settings) {
      setFrequency(settings.checkin_frequency || "weekly");
      setMinChars(settings.checkin_min_chars || 20);
      setDeviationAttention(Number(settings.deviation_attention_pct) || 10);
      setDeviationRisk(Number(settings.deviation_risk_pct) || 25);
      setOverdueDays(settings.checkin_overdue_days || 7);
      setRiskEscalationDays(settings.risk_days_before_escalation || 3);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        checkin_frequency: frequency,
        checkin_min_chars: minChars,
        deviation_attention_pct: deviationAttention,
        deviation_risk_pct: deviationRisk,
        checkin_overdue_days: overdueDays,
        risk_days_before_escalation: riskEscalationDays,
      });
      toast.success("Configurações de OKR salvas!");
    } catch {
      toast.error("Erro ao salvar configurações");
    }
  };

  if (isLoading) return null;

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                  <CalendarRange className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Períodos de OKR</p>
                  <p className="text-xs text-muted-foreground">
                    Ciclos (trimestres, semestres, anos) usados pelos objetivos.
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link to="/admin/periods">
                  Gerenciar
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-500/10">
                  <Siren className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Escalação automática</p>
                  <p className="text-xs text-muted-foreground">
                    Notifica owners e líderes de objetivos em risco/atrasados.
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link to="/admin/okr-escalation">
                  Abrir
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-500/10">
                  <Network className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Gestores</p>
                  <p className="text-xs text-muted-foreground">
                    Defina quem responde a quem na hierarquia organizacional.
                  </p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link to="/admin/managers">
                  Gerenciar
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Configurações de OKR
        </CardTitle>
        <CardDescription>
          Defina as regras de check-in, desvio aceitável e escalonamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Check-in frequency */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Frequência de Check-in</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="biweekly">Quinzenal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mín. caracteres no comentário</Label>
            <Input
              type="number"
              min={1}
              max={500}
              value={minChars}
              onChange={(e) => setMinChars(Number(e.target.value))}
            />
          </div>
        </div>

        <Separator />

        {/* Deviation thresholds */}
        <div>
          <h4 className="text-sm font-medium mb-3">Desvio aceitável (curva esperada)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Limite Atenção (%)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={deviationAttention}
                onChange={(e) => setDeviationAttention(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Desvio de {deviationAttention}% abaixo da curva → status "Atenção"
              </p>
            </div>

            <div className="space-y-2">
              <Label>Limite Risco (%)</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={deviationRisk}
                onChange={(e) => setDeviationRisk(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Desvio de {deviationRisk}% abaixo da curva → status "Em Risco"
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Escalation */}
        <div>
          <h4 className="text-sm font-medium mb-3">Escalonamento automático</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Check-in atrasado (dias)</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={overdueDays}
                onChange={(e) => setOverdueDays(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Após {overdueDays} dias sem check-in → status "Atrasado"
              </p>
            </div>

            <div className="space-y-2">
              <Label>Escalar após (dias em risco)</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={riskEscalationDays}
                onChange={(e) => setRiskEscalationDays(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Objetivo em risco por {riskEscalationDays} dias → escalar
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={updateSettings.isPending} className="w-full gap-2">
          <Save className="h-4 w-4" />
          {updateSettings.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </CardContent>
    </Card>
    </div>
  );
}
