import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TeamSelector } from "./TeamSelector";
import { PersonSelector } from "./PersonSelector";
import { useCreateObjective } from "@/hooks/useObjectives";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { toast } from "sonner";
import { Plus, Trash2, Target, Users, User } from "lucide-react";
import { Label } from "@/components/ui/label";

const keyResultSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  targetValue: z.coerce.number().min(0.01, "Meta deve ser maior que 0"),
  currentValue: z.coerce.number().min(0).default(0),
  unit: z.string().default("%"),
});

const formSchema = z.object({
  type: z.enum(["personal", "team", "individual"]),
  teamId: z.string().optional(),
  assigneeId: z.string().optional(),
  title: z.string().min(1, "Título obrigatório"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  visibility: z.enum(["public", "company", "private"]),
  keyResults: z.array(keyResultSchema).min(1, "Adicione pelo menos um Key Result"),
});

type FormData = z.infer<typeof formSchema>;

interface CreateObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateObjectiveDialog({
  open,
  onOpenChange,
}: CreateObjectiveDialogProps) {
  const { canCreateTeamOrIndividual } = useUserPermissions();
  const createObjective = useCreateObjective();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "personal",
      visibility: "company",
      keyResults: [{ title: "", targetValue: 100, currentValue: 0, unit: "%" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "keyResults",
  });

  const selectedType = form.watch("type");

  const handleSubmit = async (data: FormData) => {
    try {
      // Validate conditional fields
      if (data.type === "team" && !data.teamId) {
        toast.error("Selecione uma equipe");
        return;
      }
      if (data.type === "individual" && !data.assigneeId) {
        toast.error("Selecione uma pessoa");
        return;
      }

      await createObjective.mutateAsync({
        title: data.title,
        description: data.description,
        due_date: data.dueDate,
        visibility: data.visibility,
        type: data.type,
        team_id: data.type === "team" ? data.teamId : undefined,
        assignee_id: data.type === "individual" ? data.assigneeId : undefined,
        key_results: data.keyResults.map((kr) => ({
          title: kr.title,
          target_value: kr.targetValue,
          current_value: kr.currentValue,
          unit: kr.unit,
        })),
      });

      toast.success("Objetivo criado com sucesso!");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating objective:", error);
      toast.error("Erro ao criar objetivo");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Objetivo</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Objective Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Objetivo</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-3 gap-4"
                    >
                      <div>
                        <RadioGroupItem
                          value="personal"
                          id="personal"
                          className="peer sr-only"
                        />
                        <Label
                          htmlFor="personal"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                          <User className="mb-2 h-6 w-6" />
                          <span className="text-sm font-medium">Pessoal</span>
                          <span className="text-xs text-muted-foreground">
                            Para mim
                          </span>
                        </Label>
                      </div>

                      {canCreateTeamOrIndividual && (
                        <>
                          <div>
                            <RadioGroupItem
                              value="team"
                              id="team"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="team"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <Users className="mb-2 h-6 w-6" />
                              <span className="text-sm font-medium">Equipe</span>
                              <span className="text-xs text-muted-foreground">
                                Para toda equipe
                              </span>
                            </Label>
                          </div>

                          <div>
                            <RadioGroupItem
                              value="individual"
                              id="individual"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="individual"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <Target className="mb-2 h-6 w-6" />
                              <span className="text-sm font-medium">Individual</span>
                              <span className="text-xs text-muted-foreground">
                                Para uma pessoa
                              </span>
                            </Label>
                          </div>
                        </>
                      )}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditional Team Selector */}
            {selectedType === "team" && (
              <FormField
                control={form.control}
                name="teamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipe</FormLabel>
                    <FormControl>
                      <TeamSelector
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Conditional Person Selector */}
            {selectedType === "individual" && (
              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Atribuir para</FormLabel>
                    <FormControl>
                      <PersonSelector
                        value={field.value}
                        onValueChange={field.onChange}
                        excludeCurrentUser
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Aumentar a satisfação do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o objetivo em detalhes..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Due Date & Visibility */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Limite</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibilidade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="private">Privado</SelectItem>
                        <SelectItem value="company">Empresa</SelectItem>
                        <SelectItem value="public">Público</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Key Results */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Key Results</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ title: "", targetValue: 100, currentValue: 0, unit: "%" })
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 border rounded-lg space-y-3 bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <FormField
                      control={form.control}
                      name={`keyResults.${index}.title`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Título do Key Result" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name={`keyResults.${index}.currentValue`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Valor Atual</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`keyResults.${index}.targetValue`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Meta</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`keyResults.${index}.unit`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Unidade</FormLabel>
                          <FormControl>
                            <Input placeholder="%" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
              {form.formState.errors.keyResults?.root && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.keyResults.root.message}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createObjective.isPending}>
                {createObjective.isPending ? "Criando..." : "Criar Objetivo"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
