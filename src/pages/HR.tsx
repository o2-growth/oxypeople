import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { HRStats } from "@/components/hr/HRStats";
import { PipefySyncCard } from "@/components/hr/PipefySyncCard";
import { SyncHistoryList } from "@/components/hr/SyncHistoryList";
import { PipefyConfigDialog } from "@/components/hr/PipefyConfigDialog";
import { HRCollaboratorsTab } from "@/components/hr/HRCollaboratorsTab";
import { HRTurnoverTab } from "@/components/hr/HRTurnoverTab";
import { HRCalendarTab } from "@/components/hr/HRCalendarTab";
import { HRReportsTab } from "@/components/hr/HRReportsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, LayoutDashboard, Users, TrendingDown, CalendarDays, FileBarChart } from "lucide-react";

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
              Hub completo de gestão de recursos humanos
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="collaborators" className="gap-2">
              <Users className="h-4 w-4" />
              Colaboradores
            </TabsTrigger>
            <TabsTrigger value="turnover" className="gap-2">
              <TrendingDown className="h-4 w-4" />
              Turnover
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Calendário
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileBarChart className="h-4 w-4" />
              Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <HRStats />
            <div className="grid gap-6 md:grid-cols-2">
              <PipefySyncCard onConfigure={() => setConfigDialogOpen(true)} />
              <SyncHistoryList />
            </div>
          </TabsContent>

          <TabsContent value="collaborators">
            <HRCollaboratorsTab />
          </TabsContent>

          <TabsContent value="turnover">
            <HRTurnoverTab />
          </TabsContent>

          <TabsContent value="calendar">
            <HRCalendarTab />
          </TabsContent>

          <TabsContent value="reports">
            <HRReportsTab />
          </TabsContent>
        </Tabs>

        {/* Config Dialog */}
        <PipefyConfigDialog
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
        />
      </div>
    </AppLayout>
  );
}
