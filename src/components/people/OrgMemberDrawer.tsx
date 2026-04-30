import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Briefcase, Building2, Users } from "lucide-react";
import type { HierarchyNode } from "@/hooks/useOrganizationHierarchy";

interface OrgMemberDrawerProps {
  node: HierarchyNode | null;
  onOpenChange: (open: boolean) => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const TYPE_LABEL: Record<HierarchyNode["type"], string> = {
  company: "Sócio · CEO",
  department: "Departamento",
  team: "Time",
  member: "Colaborador",
};

export function OrgMemberDrawer({ node, onOpenChange }: OrgMemberDrawerProps) {
  const open = !!node;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        {node && (
          <>
            <SheetHeader className="space-y-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={node.avatarUrl} alt={node.name} />
                  <AvatarFallback className="text-lg font-semibold">
                    {getInitials(node.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-lg">{node.name}</SheetTitle>
                  <SheetDescription className="text-sm">
                    {node.position || node.role}
                  </SheetDescription>
                  <Badge variant="secondary" className="mt-2">
                    {TYPE_LABEL[node.type]}
                  </Badge>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-4 text-sm">
              {node.email && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{node.email}</span>
                </div>
              )}
              {node.position && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Briefcase className="h-4 w-4 shrink-0" />
                  <span>{node.position}</span>
                </div>
              )}
              {node.department && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span>{node.department}</span>
                </div>
              )}
              {node.children && node.children.length > 0 && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>
                    {node.children.length}{" "}
                    {node.type === "team" || node.type === "department" ? "membros" : "subordinados"}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
