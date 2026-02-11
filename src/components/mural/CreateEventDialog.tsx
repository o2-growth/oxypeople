import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarPlus, CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCreateEvent } from "@/hooks/useCompanyEvents";
import { toast } from "sonner";

const EVENT_TYPES = [
  { value: "monthly", label: "Monthly" },
  { value: "happy_hour", label: "Happy Hour" },
  { value: "training", label: "Treinamento" },
  { value: "town_hall", label: "Town Hall" },
  { value: "celebration", label: "Celebração" },
  { value: "other", label: "Outro" },
];

const COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316",
];

export function CreateEventDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("09:00");
  const [location, setLocation] = useState("");
  const [eventType, setEventType] = useState("other");
  const [color, setColor] = useState(COLORS[0]);
  const createEvent = useCreateEvent();

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate(undefined);
    setTime("09:00");
    setLocation("");
    setEventType("other");
    setColor(COLORS[0]);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !date) {
      toast.error("Preencha título e data");
      return;
    }

    const [hours, minutes] = time.split(":").map(Number);
    const eventDate = new Date(date);
    eventDate.setHours(hours, minutes, 0, 0);

    try {
      await createEvent.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        event_date: eventDate.toISOString(),
        location: location.trim() || undefined,
        event_type: eventType,
        color,
      });
      toast.success("Evento criado!");
      resetForm();
      setOpen(false);
    } catch {
      toast.error("Erro ao criar evento");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <CalendarPlus className="h-4 w-4" />
          Novo Evento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Evento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Monthly de Fevereiro" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes do evento..." className="min-h-[60px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} locale={ptBR} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Horário</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Local</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Sala de reunião / Link do Meet" />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cor</Label>
            <div className="flex gap-2 mt-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn("h-6 w-6 rounded-full transition-all", color === c ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-110")}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={createEvent.isPending} className="w-full">
            {createEvent.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Criar Evento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
