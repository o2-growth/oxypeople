import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bookmark, Plus, Trash2, Star } from "lucide-react";
import { useSavedFilters } from "@/hooks/useSavedFilters";
import { ObjectivesFilterState } from "@/hooks/useObjectivesFilters";
import { toast } from "sonner";

interface SavedFiltersMenuProps {
  currentFilters: ObjectivesFilterState;
  onApplyFilter: (filters: ObjectivesFilterState) => void;
  hasActiveFilters: boolean;
}

export function SavedFiltersMenu({
  currentFilters,
  onApplyFilter,
  hasActiveFilters,
}: SavedFiltersMenuProps) {
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [filterName, setFilterName] = useState("");
  const { savedFilters, saveFilter, deleteFilter } = useSavedFilters();

  const handleSave = () => {
    if (!filterName.trim()) {
      toast.error("Digite um nome para o filtro.");
      return;
    }
    saveFilter.mutate(
      { name: filterName.trim(), payload: currentFilters },
      {
        onSuccess: () => {
          setIsSaveOpen(false);
          setFilterName("");
        },
      }
    );
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
            <Bookmark className="h-3 w-3" />
            Favoritos
            {savedFilters.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {savedFilters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="start">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-xs">Filtros Salvos</h4>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] gap-1 px-2"
                  onClick={() => setIsSaveOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  Salvar atual
                </Button>
              )}
            </div>

            {savedFilters.length === 0 ? (
              <p className="text-[10px] text-muted-foreground py-2">
                Nenhum filtro salvo. Aplique filtros e clique em "Salvar atual".
              </p>
            ) : (
              <ScrollArea className="max-h-48">
                <div className="space-y-1">
                  {savedFilters.map((filter) => (
                    <div
                      key={filter.id}
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer group"
                      onClick={() => onApplyFilter(filter.payload)}
                    >
                      <Star className="h-3 w-3 text-amber-500 shrink-0" />
                      <span className="text-xs flex-1 truncate">{filter.name}</span>
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFilter.mutate(filter.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Salvar Filtro</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nome do filtro..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsSaveOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saveFilter.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
