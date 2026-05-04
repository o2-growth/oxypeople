import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyUsers } from "@/hooks/useCompanyUsers";
import { useCreateFeedbackRequest } from "@/hooks/useCreateFeedbackRequest";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Send, MessageSquareQuote } from "lucide-react";
import { toast } from "sonner";
import { UserPicker } from "./UserPicker";
import { VisibilityRadio } from "./VisibilityRadio";
import { CompetencyTagsInput } from "./CompetencyTagsInput";
import {
  DEFAULT_FEEDBACK_FORM,
  feedbackRequestSchema,
  validateRequesterRules,
  type FeedbackRequestFormValues,
} from "@/lib/validation/feedbackRequestSchema";

interface FeedbackRequestFormProps {
  /** Pré-preenche o subject (vindo de um perfil/organograma) */
  presetSubjectId?: string;
  onSuccess?: () => void;
}

export function FeedbackRequestForm({ presetSubjectId, onSuccess }: FeedbackRequestFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: companyUsers, isLoading: usersLoading } = useCompanyUsers();
  const create = useCreateFeedbackRequest();
  const requesterId = user?.id ?? "";

  const form = useForm<FeedbackRequestFormValues>({
    resolver: zodResolver(feedbackRequestSchema),
    defaultValues: {
      ...DEFAULT_FEEDBACK_FORM,
      subject_user_id: presetSubjectId ?? "",
    },
  });

  useEffect(() => {
    if (presetSubjectId) {
      form.setValue("subject_user_id", presetSubjectId);
    }
  }, [presetSubjectId, form]);

  const subjectId = form.watch("subject_user_id");

  const handleSubmit = form.handleSubmit(async (values) => {
    const requesterCheck = validateRequesterRules(values, requesterId);
    if (!requesterCheck.ok) {
      form.setError(requesterCheck.field, { message: requesterCheck.message });
      toast.error(requesterCheck.message);
      return;
    }
    try {
      await create.mutateAsync(values);
      if (onSuccess) onSuccess();
      else navigate("/", { replace: true });
    } catch {
      // toasts já cobertos pelo hook
    }
  });

  const allUsers = companyUsers ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquareQuote className="h-5 w-5" />
          Pedir feedback
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="subject_user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobre quem é o feedback?</FormLabel>
                    <FormControl>
                      <UserPicker
                        users={allUsers}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={usersLoading}
                        placeholder="Selecione a pessoa avaliada"
                        excludeIds={[requesterId]}
                      />
                    </FormControl>
                    <FormDescription>Você não pode avaliar a si mesmo.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="respondent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quem deve responder?</FormLabel>
                    <FormControl>
                      <UserPicker
                        users={allUsers}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={usersLoading}
                        placeholder="Quem dá o feedback"
                        excludeIds={subjectId ? [subjectId, requesterId] : [requesterId]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pergunta</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Como você avalia a contribuição dela no projeto X nos últimos 30 dias? Foque em comunicação e entregas."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <FormDescription>
                    Mínimo 50, máximo 2000 caracteres. Quanto mais específico, melhor o feedback.
                    {" "}
                    <span className="text-muted-foreground">
                      ({field.value.length}/2000)
                    </span>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="competency_tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Competências (opcional)</FormLabel>
                  <FormControl>
                    <CompetencyTagsInput value={field.value} onChange={field.onChange} />
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
                  <FormControl>
                    <VisibilityRadio value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo (opcional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="w-fit" />
                  </FormControl>
                  <FormDescription>
                    Se preenchido, o respondente vê o prazo no app.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={create.isPending} className="gap-1.5">
                {create.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar pedido
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
