import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { FeedbackRequestForm } from "@/components/feedback/FeedbackRequestForm";

export default function NewFeedbackRequestPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const presetSubject = params.get("subject") ?? undefined;

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl space-y-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-1.5 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <FeedbackRequestForm presetSubjectId={presetSubject} />
      </div>
    </AppLayout>
  );
}
