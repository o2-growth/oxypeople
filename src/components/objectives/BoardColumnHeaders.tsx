export function BoardColumnHeaders() {
  return (
    <div className="flex items-center h-9 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50 bg-muted/30">
      <div className="flex-1 min-w-0 px-3">Item</div>
      <div className="w-[100px] text-center px-1">Tipo</div>
      <div className="w-[100px] text-center px-1">Status</div>
      <div className="w-[90px] text-center px-1">Alertas</div>
      <div className="w-[130px] text-center px-3">Progresso</div>
      <div className="w-[44px] text-center">Dono</div>
      <div className="w-[50px] text-center">KRs</div>
      <div className="w-[60px] text-center">Prazo</div>
      <div className="w-[36px]" />
    </div>
  );
}
