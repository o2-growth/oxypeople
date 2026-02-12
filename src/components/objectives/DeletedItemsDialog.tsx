import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RotateCcw, Search, Target, Key, ClipboardCheck, Trash2 } from "lucide-react";
import { useDeletedItems, useRestoreItem } from "@/hooks/useDeletedItems";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DeletedItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const entityLabels: Record<string, { label: string; icon: typeof Target }> = {
  objective: { label: "Objetivo", icon: Target },
  key_result: { label: "Key Result", icon: Key },
  checkin: { label: "Check-in", icon: ClipboardCheck },
};

export function DeletedItemsDialog({ open, onOpenChange }: DeletedItemsDialogProps) {
  const [search, setSearch] = useState("");
  const { data: items = [], isLoading } = useDeletedItems();
  const restoreItem = useRestoreItem();

  const filtered = search
    ? items.filter((i) => i.title.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-muted-foreground" />
            Itens Deletados
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>

        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <Trash2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum item deletado.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => {
                const config = entityLabels[item.entity_type] || entityLabels.objective;
                const Icon = config.icon;

                return (
                  <div
                    key={`${item.entity_type}-${item.entity_id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className="p-1.5 rounded-md bg-muted">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] h-4">
                          {config.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(item.deleted_at), "dd MMM yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs h-7 shrink-0"
                      disabled={restoreItem.isPending}
                      onClick={() =>
                        restoreItem.mutate({
                          entityType: item.entity_type,
                          entityId: item.entity_id,
                        })
                      }
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restaurar
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
