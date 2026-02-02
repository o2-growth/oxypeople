import { useDepartments } from "@/hooks/useDepartments";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface DepartmentSelectorProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  placeholder?: string;
}

export function DepartmentSelector({
  value,
  onValueChange,
  placeholder = "Selecione a área",
}: DepartmentSelectorProps) {
  const { data: departments, isLoading } = useDepartments();

  const handleChange = (newValue: string) => {
    if (newValue === "none") {
      onValueChange(undefined);
      return;
    }
    onValueChange(newValue);
  };

  return (
    <Select value={value || "none"} onValueChange={handleChange}>
      <SelectTrigger>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Sem área definida</SelectItem>
        {isLoading ? (
          <SelectItem value="loading" disabled>
            Carregando...
          </SelectItem>
        ) : departments && departments.length > 0 ? (
          departments.map((dept) => (
            <SelectItem key={dept.name} value={dept.name}>
              {dept.name}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="empty" disabled>
            Nenhuma área cadastrada
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
