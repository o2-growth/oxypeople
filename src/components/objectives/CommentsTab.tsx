import { useState, KeyboardEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, MessageSquare, Send, Trash2, Pencil } from "lucide-react";
import { useObjectiveComments, type ObjectiveComment } from "@/hooks/useObjectiveComments";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CommentsTabProps {
  objectiveId: string;
  keyResultId?: string | null;
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email.charAt(0).toUpperCase();
}

export function CommentsTab({ objectiveId, keyResultId = null }: CommentsTabProps) {
  const { user } = useAuth();
  const { isAdmin } = useUserPermissions();
  const { comments, isLoading, createComment, updateComment, deleteComment } =
    useObjectiveComments(objectiveId, { keyResultId });

  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const trimmed = draft.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= 5000 && !!user?.id;

  const handleSubmit = async () => {
    if (!canSubmit || !user?.id) return;
    await createComment.mutateAsync({
      content: trimmed,
      authorId: user.id,
      keyResultId: keyResultId ?? null,
    });
    setDraft("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handleStartEdit = (c: ObjectiveComment) => {
    setEditingId(c.id);
    setEditingContent(c.content);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await updateComment.mutateAsync({ commentId: editingId, content: editingContent });
    setEditingId(null);
    setEditingContent("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-base font-semibold">Discussão</h3>
        <Badge variant="outline" className="ml-1">
          {comments.length}
        </Badge>
        {keyResultId && (
          <Badge variant="secondary" className="ml-1 text-[10px]">
            Filtrado por KR
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Nenhum comentário ainda. Inicie a discussão abaixo.
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => {
            const isOwner = !!user?.id && c.author_id === user.id;
            const canDelete = isOwner || isAdmin;
            const isEditing = editingId === c.id;
            return (
              <div key={c.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={c.author?.avatar_url || ""} />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(c.author?.full_name ?? null, c.author?.email ?? "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium truncate">
                        {c.author?.full_name || c.author?.email || "—"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(c.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                        {c.edited_at && " · editado"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isOwner && !isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleStartEdit(c)}
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {canDelete && !isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setRemoveTarget(c.id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      maxLength={5000}
                      rows={3}
                      className="text-sm"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(null);
                          setEditingContent("");
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={
                          updateComment.isPending ||
                          editingContent.trim().length < 1 ||
                          editingContent.trim().length > 5000
                        }
                      >
                        {updateComment.isPending && (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        )}
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                    {c.content}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Compose box */}
      <div className="space-y-2 border-t pt-4">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva um comentário... (Enter para enviar, Shift+Enter para nova linha)"
          rows={3}
          maxLength={5000}
          className="text-sm"
        />
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "text-[10px] text-muted-foreground",
              trimmed.length > 5000 && "text-destructive",
            )}
          >
            {trimmed.length}/5000
          </span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit || createComment.isPending}
            className="gap-1.5"
          >
            {createComment.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Publicar
          </Button>
        </div>
      </div>

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comentário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removeTarget) {
                  deleteComment.mutate(removeTarget);
                  setRemoveTarget(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
