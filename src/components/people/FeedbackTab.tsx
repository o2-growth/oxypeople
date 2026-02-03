import { useState } from "react";
import { useOnboardingFeedbacks, OnboardingFeedback } from "@/hooks/useOnboardingFeedback";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FeedbackResponseView } from "./FeedbackResponseView";
import { ForwardFeedbackDialog } from "./ForwardFeedbackDialog";
import { exportFeedbackToCSV, exportSingleFeedbackToCSV } from "./FeedbackExport";
import {
  Search,
  Download,
  Eye,
  Forward,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function FeedbackTab() {
  const { profile } = useUser();
  const companyId = profile?.primary_company_id;
  const { data: feedbacks, isLoading } = useOnboardingFeedbacks(companyId || undefined);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedFeedback, setSelectedFeedback] = useState<OnboardingFeedback | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isForwardOpen, setIsForwardOpen] = useState(false);
  const [feedbackToForward, setFeedbackToForward] = useState<string | null>(null);

  const filteredFeedbacks = feedbacks?.filter((feedback) => {
    const matchesSearch =
      !searchQuery ||
      feedback.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || feedback.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleView = (feedback: OnboardingFeedback) => {
    setSelectedFeedback(feedback);
    setIsViewOpen(true);
  };

  const handleForward = (feedbackId: string) => {
    setFeedbackToForward(feedbackId);
    setIsForwardOpen(true);
  };

  const handleExportAll = () => {
    if (filteredFeedbacks && filteredFeedbacks.length > 0) {
      exportFeedbackToCSV(filteredFeedbacks);
    }
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    if (status === "completed") {
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completo
        </Badge>
      );
    }

    const daysRemaining = differenceInDays(new Date(dueDate), new Date());

    if (daysRemaining < 0) {
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
          <AlertCircle className="h-3 w-3 mr-1" />
          Expirado
        </Badge>
      );
    }

    if (daysRemaining <= 5) {
      return (
        <Badge className="bg-warning/10 text-warning border-warning/20">
          <Clock className="h-3 w-3 mr-1" />
          {daysRemaining} dias restantes
        </Badge>
      );
    }

    return (
      <Badge className="bg-muted text-muted-foreground">
        <Clock className="h-3 w-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="completed">Completos</SelectItem>
              <SelectItem value="expired">Expirados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={handleExportAll}
          disabled={!filteredFeedbacks?.length}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Feedback List */}
      {filteredFeedbacks?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhum feedback encontrado
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredFeedbacks?.map((feedback) => {
            const userName = feedback.user?.full_name || "Usuário";
            const userInitials = userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2);

            return (
              <Card key={feedback.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={feedback.user?.avatar_url || undefined} />
                        <AvatarFallback>{userInitials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{userName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {feedback.user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="hidden sm:block text-right">
                        <p className="text-sm text-muted-foreground">Prazo</p>
                        <p className="text-sm font-medium">
                          {format(new Date(feedback.due_date), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>

                      {getStatusBadge(feedback.status, feedback.due_date)}

                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleView(feedback)}
                          disabled={feedback.status !== "completed"}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleForward(feedback.id)}
                          disabled={feedback.status !== "completed"}
                        >
                          <Forward className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Dialog */}
      <FeedbackResponseView
        feedback={selectedFeedback}
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        onForward={() => {
          if (selectedFeedback) {
            setIsViewOpen(false);
            handleForward(selectedFeedback.id);
          }
        }}
        onExport={() => {
          if (selectedFeedback) {
            exportSingleFeedbackToCSV(selectedFeedback);
          }
        }}
      />

      {/* Forward Dialog */}
      {feedbackToForward && (
        <ForwardFeedbackDialog
          feedbackId={feedbackToForward}
          open={isForwardOpen}
          onOpenChange={(open) => {
            setIsForwardOpen(open);
            if (!open) setFeedbackToForward(null);
          }}
        />
      )}
    </div>
  );
}
