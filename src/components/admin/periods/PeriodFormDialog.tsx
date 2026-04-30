import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { PeriodAdminRow, PeriodInput } from "@/hooks/usePeriodsAdmin";

const periodSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório").max(80, "Máximo 80 caracteres"),
    start_date: z.string().min(1, "Data inicial é obrigatória"),
    end_date: z.string().min(1, "Data final é obrigatória"),
  })
  .refine((value) => value.start_date < value.end_date, {
    message: "Data final precisa ser após a inicial",
    path: ["end_date"],
  });

type PeriodFormValues = z.infer<typeof periodSchema>;

interface PeriodFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue?: PeriodAdminRow | null;
  onSubmit: (values: PeriodInput) => Promise<void>;
  isSubmitting: boolean;
}

const EMPTY: PeriodFormValues = { name: "", start_date: "", end_date: "" };

export function PeriodFormDialog({
  open,
  onOpenChange,
  initialValue,
  onSubmit,
  isSubmitting,
}: PeriodFormDialogProps) {
  const form = useForm<PeriodFormValues>({
    resolver: zodResolver(periodSchema),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) {
      form.reset(
        initialValue
          ? {
              name: initialValue.name,
              start_date: initialValue.start_date,
              end_date: initialValue.end_date,
            }
          : EMPTY,
      );
    }
  }, [open, initialValue, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initialValue ? "Editar período" : "Novo período"}</DialogTitle>
          <DialogDescription>
            Períodos são ciclos de OKR (trimestre, semestre, ano).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Q2 2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fim</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialValue ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
