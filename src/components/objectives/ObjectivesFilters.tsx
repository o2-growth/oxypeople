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
  Filter,
  X,
  ChevronDown,
  Building2,
  User,
  Calendar,
  SlidersHorizontal,
} from "lucide-react";
import { ObjectivesFilterState } from "@/hooks/useObjectivesFilters";

interface ObjectivesFiltersProps {
  pendingFilters: ObjectivesFilterState;
  setPendingFilters: React.Dispatch<React.SetStateAction<ObjectivesFilterState>>;
  applyFilters: () => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  removeFilter: (key: keyof ObjectivesFilterState, value?: string) => void;
  filters: ObjectivesFilterState;
  departments: string[];
  responsibleUsers: { id: string; name: string; email: string; avatar_url: string | null }[];
  setPeriodPreset: (preset: "Q1" | "Q2" | "Q3" | "Q4" | null) => void;
}

export function ObjectivesFilters({
  pendingFilters,
  setPendingFilters,
  applyFilters,
  clearFilters,
  hasActiveFilters,
  removeFilter,
  filters,
  departments,
  responsibleUsers,
  setPeriodPreset,
}: ObjectivesFiltersProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDepartmentToggle = (dept: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter((d) => d !== dept)
        : [...prev.departments, dept],
    }));
  };

  const handleResponsibleToggle = (userId: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      responsibleIds: prev.responsibleIds.includes(userId)
        ? prev.responsibleIds.filter((id) => id !== userId)
        : [...prev.responsibleIds, userId],
    }));
  };

  const progressRanges: { label: string; value: [number, number] }[] = [
    { label: "0-25%", value: [0, 25] },
    { label: "25-50%", value: [25, 50] },
    { label: "50-75%", value: [50, 75] },
    { label: "75-100%", value: [75, 100] },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Departments Select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Building2 className="h-4 w-4" />
              Departamentos
              {pendingFilters.departments.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {pendingFilters.departments.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Selecionar Departamentos</h4>
              <Separator />
              {departments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Nenhum departamento encontrado
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {departments.map((dept) => (
                    <div key={dept} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dept-${dept}`}
                        checked={pendingFilters.departments.includes(dept)}
                        onCheckedChange={() => handleDepartmentToggle(dept)}
                      />
                      <Label
                        htmlFor={`dept-${dept}`}
                        className="text-sm cursor-pointer"
                      >
                        {dept}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Responsible Select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <User className="h-4 w-4" />
              Responsáveis
              {pendingFilters.responsibleIds.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {pendingFilters.responsibleIds.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="start">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Selecionar Responsáveis</h4>
              <Separator />
              {responsibleUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  Nenhum responsável encontrado
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {responsibleUsers.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={pendingFilters.responsibleIds.includes(user.id)}
                        onCheckedChange={() => handleResponsibleToggle(user.id)}
                      />
                      <Label
                        htmlFor={`user-${user.id}`}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar_url || ""} />
                          <AvatarFallback className="text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{user.name}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Period Select */}
        <Select
          value={pendingFilters.period.preset || ""}
          onValueChange={(value) =>
            setPeriodPreset(value as "Q1" | "Q2" | "Q3" | "Q4" | null)
          }
        >
          <SelectTrigger className="w-40">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Q1">Q1 ({new Date().getFullYear()})</SelectItem>
            <SelectItem value="Q2">Q2 ({new Date().getFullYear()})</SelectItem>
            <SelectItem value="Q3">Q3 ({new Date().getFullYear()})</SelectItem>
            <SelectItem value="Q4">Q4 ({new Date().getFullYear()})</SelectItem>
          </SelectContent>
        </Select>

        {/* More Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Mais Filtros
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <h4 className="font-medium">Filtros Avançados</h4>
              <Separator />

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                  value={pendingFilters.status}
                  onValueChange={(value: "all" | "active" | "completed") =>
                    setPendingFilters((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="completed">Concluídos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Progress Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Progresso</Label>
                <div className="grid grid-cols-2 gap-2">
                  {progressRanges.map((range) => (
                    <Button
                      key={range.label}
                      variant={
                        pendingFilters.progressRange &&
                        pendingFilters.progressRange[0] === range.value[0] &&
                        pendingFilters.progressRange[1] === range.value[1]
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setPendingFilters((prev) => ({
                          ...prev,
                          progressRange:
                            prev.progressRange &&
                            prev.progressRange[0] === range.value[0]
                              ? null
                              : range.value,
                        }))
                      }
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Visibility */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Visibilidade</Label>
                <Select
                  value={pendingFilters.visibility}
                  onValueChange={(value: "all" | "company" | "private") =>
                    setPendingFilters((prev) => ({ ...prev, visibility: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="company">Empresa</SelectItem>
                    <SelectItem value="private">Privado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Check-in Status */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status de Check-in</Label>
                <Select
                  value={pendingFilters.checkInStatus}
                  onValueChange={(value: "all" | "on-time" | "late") =>
                    setPendingFilters((prev) => ({ ...prev, checkInStatus: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="on-time">Em dia</SelectItem>
                    <SelectItem value="late">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Apply Button */}
        <Button onClick={applyFilters} className="gap-2">
          <Filter className="h-4 w-4" />
          Filtrar
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.departments.map((dept) => (
            <Badge key={dept} variant="secondary" className="gap-1">
              <Building2 className="h-3 w-3" />
              {dept}
              <button
                onClick={() => removeFilter("departments", dept)}
                className="ml-1 hover:bg-muted rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {filters.responsibleIds.map((userId) => {
            const user = responsibleUsers.find((u) => u.id === userId);
            return (
              <Badge key={userId} variant="secondary" className="gap-1">
                <User className="h-3 w-3" />
                {user?.name || "Usuário"}
                <button
                  onClick={() => removeFilter("responsibleIds", userId)}
                  className="ml-1 hover:bg-muted rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}

          {filters.period.preset && (
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              {filters.period.preset} {new Date().getFullYear()}
              <button
                onClick={() => removeFilter("period")}
                className="ml-1 hover:bg-muted rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.status !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status === "active" ? "Ativos" : "Concluídos"}
              <button
                onClick={() => removeFilter("status")}
                className="ml-1 hover:bg-muted rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.progressRange && (
            <Badge variant="secondary" className="gap-1">
              {filters.progressRange[0]}-{filters.progressRange[1]}%
              <button
                onClick={() => removeFilter("progressRange")}
                className="ml-1 hover:bg-muted rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.visibility !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {filters.visibility === "company" ? "Empresa" : "Privado"}
              <button
                onClick={() => removeFilter("visibility")}
                className="ml-1 hover:bg-muted rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.checkInStatus !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Check-in: {filters.checkInStatus === "on-time" ? "Em dia" : "Atrasado"}
              <button
                onClick={() => removeFilter("checkInStatus")}
                className="ml-1 hover:bg-muted rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
