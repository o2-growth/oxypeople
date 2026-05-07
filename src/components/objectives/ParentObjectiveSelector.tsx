import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, ChevronsUpDown, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type ParentObjectiveType = "strategic" | "tactical" | "operational";

interface ParentObjective {
  id: string;
  title: string;
  progress: number;
  type: ParentObjectiveType;
  owner: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ParentObjectiveSelectorProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  excludeId?: string;
  placeholder?: string;
  allowedParentTypes?: Array<ParentObjectiveType>;
}

export function ParentObjectiveSelector({
  value,
  onValueChange,
  excludeId,
  placeholder = "Vincular a objetivo pai",
  allowedParentTypes,
}: ParentObjectiveSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;

  const { data: objectives, isLoading } = useQuery({
    queryKey: ["parent-objectives", companyId],
    queryFn: async (): Promise<ParentObjective[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("objectives")
        .select(`
          id,
          title,
          progress,
          type,
          owner:users!objectives_owner_id_fkey(id, full_name, avatar_url)
        `)
        .eq("company_id", companyId)
        .neq("visibility", "private")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching objectives:", error);
        return [];
      }

      interface ObjectiveRow {
        id: string;
        title: string;
        progress: number;
        type: string;
        owner:
          | { id: string; full_name: string | null; avatar_url: string | null }
          | { id: string; full_name: string | null; avatar_url: string | null }[]
          | null;
      }

      return ((data || []) as unknown as ObjectiveRow[]).map((obj) => ({
        id: obj.id,
        title: obj.title,
        progress: obj.progress,
        type: obj.type as ParentObjectiveType,
        owner: Array.isArray(obj.owner) ? obj.owner[0] ?? null : obj.owner,
      }));
    },
    enabled: !!companyId,
  });

  const filteredObjectives = (objectives || [])
    .filter((obj) => {
      if (excludeId && obj.id === excludeId) return false;
      if (allowedParentTypes && !allowedParentTypes.includes(obj.type)) return false;
      if (!search) return true;
      return obj.title.toLowerCase().includes(search.toLowerCase());
    })
    .slice(0, 20);

  const noCompatibleParents =
    !!allowedParentTypes &&
    !isLoading &&
    (objectives || []).filter(
      (obj) => (!excludeId || obj.id !== excludeId) && allowedParentTypes.includes(obj.type),
    ).length === 0;

  const selectedObjective = objectives?.find((obj) => obj.id === value);

  const getInitials = (name: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "?";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedObjective ? (
            <div className="flex items-center gap-2 truncate">
              <Target className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{selectedObjective.title}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar objetivo..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading
                ? "Carregando..."
                : noCompatibleParents
                  ? "Nenhum objetivo pai compatível disponível"
                  : "Nenhum objetivo encontrado."}
            </CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  onSelect={() => {
                    onValueChange(undefined);
                    setOpen(false);
                  }}
                  className="text-muted-foreground"
                >
                  <span>Remover vínculo</span>
                </CommandItem>
              )}
              {filteredObjectives.map((objective) => (
                <CommandItem
                  key={objective.id}
                  value={objective.id}
                  onSelect={() => {
                    onValueChange(objective.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === objective.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm truncate">{objective.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {objective.owner && (
                        <div className="flex items-center gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={objective.owner.avatar_url || ""} />
                            <AvatarFallback className="text-[8px]">
                              {getInitials(objective.owner.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {objective.owner.full_name?.split(" ")[0]}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 flex-1">
                        <Progress value={objective.progress} className="h-1 flex-1" />
                        <span className="text-xs text-muted-foreground">
                          {objective.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
