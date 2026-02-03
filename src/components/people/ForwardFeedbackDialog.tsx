import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useForwardFeedback } from "@/hooks/useOnboardingFeedback";
import { useMentionSuggestions } from "@/hooks/useMentionSuggestions";
import { Search, Loader2, Forward } from "lucide-react";

interface ForwardFeedbackDialogProps {
  feedbackId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ForwardFeedbackDialog({
  feedbackId,
  open,
  onOpenChange,
}: ForwardFeedbackDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { data: suggestions, isLoading } = useMentionSuggestions(searchQuery);
  const forwardFeedback = useForwardFeedback();

  const handleToggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleForward = async () => {
    if (selectedUsers.length === 0) return;

    await forwardFeedback.mutateAsync({
      feedbackId,
      forwardToIds: selectedUsers,
    });

    setSelectedUsers([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Forward className="h-5 w-5 text-primary" />
            Encaminhar Feedback
          </DialogTitle>
          <DialogDescription>
            Selecione os líderes que devem receber este feedback.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2">
            <Label>Destinatários</Label>
            <ScrollArea className="h-[250px] rounded-md border p-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !suggestions?.users?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum usuário encontrado
                </p>
              ) : (
                <div className="space-y-1">
                  {suggestions.users.map((user) => {
                    const initials = (user.full_name || user.email)
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => handleToggleUser(user.id)}
                      >
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleToggleUser(user.id)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.full_name || user.email}
                          </p>
                          {user.full_name && (
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {selectedUsers.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedUsers.length} destinatário(s) selecionado(s)
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleForward}
            disabled={selectedUsers.length === 0 || forwardFeedback.isPending}
          >
            {forwardFeedback.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Encaminhar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
