import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  X,
  Building2,
  User,
  Calendar,
} from "lucide-react";
import { ObjectivesFilterState } from "@/hooks/useObjectivesFilters";
import { usePeriods } from "@/hooks/useObjectives";

interface ObjectivesFiltersProps {
  filters: ObjectivesFilterState;
  setFilters: React.Dispatch<React.SetStateAction<ObjectivesFilterState>>;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  departments: string[];
  responsibleUsers: { id: string; name: string; email: string; avatar_url: string | null }[];
}

export function ObjectivesFilters({
  filters,
  setFilters,
  clearFilters,
  hasActiveFilters,
  departments,
  responsibleUsers,
}: ObjectivesFiltersProps) {
  const { data: periods = [] } = usePeriods();

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleDepartmentToggle = (dept: string) => {
    setFilters((prev) => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter((d) => d !== dept)
        : [...prev.departments, dept],
    }));
  };

  const handleResponsibleToggle = (userId: string) => {
    setFilters((prev) => ({
      ...prev,
      responsibleIds: prev.responsibleIds.includes(userId)
        ? prev.responsibleIds.filter((id) => id !== userId)
        : [...prev.responsibleIds, userId],
    }));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Type filter */}
        <Select
          value={filters.objectiveType}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, objectiveType: value as any }))}
        >
          <SelectTrigger className="w-36 h-9 text-xs">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="strategic">Estratégico</SelectItem>
            <SelectItem value="tactical">Tático</SelectItem>
            <SelectItem value="operational">Operacional</SelectItem>
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value as any }))}
        >
          <SelectTrigger className="w-32 h-9 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="planned">Planejado</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="risk">Em Risco</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="canceled">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        {/* Period filter */}
        <Select
          value={filters.periodId || "all"}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, periodId: value === "all" ? null : value }))
          }
        >
          <SelectTrigger className="w-36 h-9 text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os períodos</SelectItem>
            {periods.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Departments */}
        {departments.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 h-9 text-xs">
                <Building2 className="h-3 w-3" />
                Área
                {filters.departments.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {filters.departments.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <div className="space-y-2">
                <h4 className="font-medium text-xs">Departamentos</h4>
                <Separator />
                <div className="max-h-40 overflow-y-auto space-y-1.5">
                  {departments.map((dept) => (
                    <div key={dept} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dept-${dept}`}
                        checked={filters.departments.includes(dept)}
                        onCheckedChange={() => handleDepartmentToggle(dept)}
                      />
                      <Label htmlFor={`dept-${dept}`} className="text-xs cursor-pointer">
                        {dept}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Responsible */}
        {responsibleUsers.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 h-9 text-xs">
                <User className="h-3 w-3" />
                Dono
                {filters.responsibleIds.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    {filters.responsibleIds.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-2">
                <h4 className="font-medium text-xs">Responsáveis</h4>
                <Separator />
                <div className="max-h-40 overflow-y-auto space-y-1.5">
                  {responsibleUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={filters.responsibleIds.includes(user.id)}
                        onCheckedChange={() => handleResponsibleToggle(user.id)}
                      />
                      <Label htmlFor={`user-${user.id}`} className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={user.avatar_url || ""} />
                          <AvatarFallback className="text-[8px]">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{user.name}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Clear */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 h-9 text-xs">
            <X className="h-3 w-3" />
            Limpar
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5">
          {filters.objectiveType !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {filters.objectiveType === "strategic" ? "Estratégico" : filters.objectiveType === "tactical" ? "Tático" : "Operacional"}
              <button onClick={() => setFilters((p) => ({ ...p, objectiveType: "all" }))} className="ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status !== "all" && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {filters.status}
              <button onClick={() => setFilters((p) => ({ ...p, status: "all" }))} className="ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.periodId && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {periods.find((p) => p.id === filters.periodId)?.name || "Período"}
              <button onClick={() => setFilters((p) => ({ ...p, periodId: null }))} className="ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.departments.map((dept) => (
            <Badge key={dept} variant="secondary" className="gap-1 text-xs">
              {dept}
              <button onClick={() => handleDepartmentToggle(dept)} className="ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.responsibleIds.map((userId) => (
            <Badge key={userId} variant="secondary" className="gap-1 text-xs">
              {responsibleUsers.find((u) => u.id === userId)?.name || "Usuário"}
              <button onClick={() => handleResponsibleToggle(userId)} className="ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
