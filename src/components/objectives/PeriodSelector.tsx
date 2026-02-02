import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, endOfQuarter, startOfQuarter, addYears } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PeriodSelectorProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  onDueDateChange?: (date: string | undefined) => void;
}

interface PeriodOption {
  value: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

function generatePeriodOptions(): PeriodOption[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const options: PeriodOption[] = [];

  // Generate Q1-Q4 for current year and next year
  for (let year = currentYear; year <= currentYear + 1; year++) {
    for (let quarter = 1; quarter <= 4; quarter++) {
      const quarterStart = new Date(year, (quarter - 1) * 3, 1);
      const quarterEnd = endOfQuarter(quarterStart);
      
      options.push({
        value: `Q${quarter}-${year}`,
        label: `Q${quarter} ${year}`,
        startDate: quarterStart,
        endDate: quarterEnd,
      });
    }
  }

  return options;
}

export function PeriodSelector({
  value,
  onValueChange,
  onDueDateChange,
}: PeriodSelectorProps) {
  const options = generatePeriodOptions();

  const handleChange = (newValue: string) => {
    if (newValue === "none") {
      onValueChange(undefined);
      onDueDateChange?.(undefined);
      return;
    }

    onValueChange(newValue);
    
    // Find the selected period and set due_date to end of quarter
    const selectedPeriod = options.find((opt) => opt.value === newValue);
    if (selectedPeriod && onDueDateChange) {
      onDueDateChange(format(selectedPeriod.endDate, "yyyy-MM-dd"));
    }
  };

  return (
    <Select value={value || "none"} onValueChange={handleChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione o período" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Sem período definido</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
