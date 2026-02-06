import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { HRStats } from "@/components/hr/HRStats";
import { PipefySyncCard } from "@/components/hr/PipefySyncCard";
import { SyncHistoryList } from "@/components/hr/SyncHistoryList";
import { PipefyConfigDialog } from "@/components/hr/PipefyConfigDialog";
import { Briefcase } from "lucide-react";

export default function HR() {
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              Recursos Humanos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestão de colaboradores integrada ao Pipefy
            </p>
          </div>
        </div>

        {/* Stats */}
        <HRStats />

        {/* Sync Section */}
        <div className="grid gap-6 md:grid-cols-2">
          <PipefySyncCard onConfigure={() => setConfigDialogOpen(true)} />
          <SyncHistoryList />
        </div>

        {/* Config Dialog */}
        <PipefyConfigDialog
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
        />
      </div>
    </AppLayout>
  );
}
