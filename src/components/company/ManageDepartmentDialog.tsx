import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2 } from "lucide-react";
import type { Department } from "@/hooks/useDepartmentsManager";
import { DepartmentMembersList } from "./DepartmentMembersList";
import { DepartmentTeamsList } from "./DepartmentTeamsList";

interface ManageDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
}

export function ManageDepartmentDialog({
  open,
  onOpenChange,
  department,
}: ManageDepartmentDialogProps) {
  const [activeTab, setActiveTab] = useState("members");

  if (!department) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${department.color}20` }}
            >
              <Building2 className="h-5 w-5" style={{ color: department.color }} />
            </div>
            <div>
              <DialogTitle>{department.name}</DialogTitle>
              {department.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {department.description}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Membros ({department.member_count})
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2">
              <Building2 className="h-4 w-4" />
              Equipes ({department.team_count})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="flex-1 overflow-auto mt-4">
            <DepartmentMembersList departmentId={department.id} />
          </TabsContent>

          <TabsContent value="teams" className="flex-1 overflow-auto mt-4">
            <DepartmentTeamsList departmentId={department.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
