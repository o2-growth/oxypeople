import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Building2,
  Trophy,
  Target,
  BarChart3,
  Settings,
  ChevronDown,
  Sparkles,
  Zap,
  UsersRound,
  ClipboardCheck,
  Gamepad2,
  Briefcase,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Feed", url: "/feed", icon: MessageSquare },
  { title: "Pessoas", url: "/people", icon: Users },
  { title: "Automação", url: "/automation", icon: Zap },
];

const engagementItems = [
  { title: "Reconhecimentos", url: "/recognition", icon: Trophy },
  { title: "Objetivos", url: "/objectives", icon: Target },
  { title: "Desempenho", url: "/performance", icon: ClipboardCheck },
  { title: "Pesquisas", url: "/surveys", icon: BarChart3 },
  { title: "Gamificação", url: "/gamification", icon: Gamepad2 },
];

const managementItems = [
  { title: "Empresa", url: "/company", icon: Building2 },
  { title: "RH", url: "/hr", icon: Briefcase },
  { title: "Equipes", url: "/teams", icon: UsersRound },
  { title: "Configurações", url: "/settings", icon: Settings },
];

interface NavGroupProps {
  label: string;
  items: typeof mainNavItems;
  defaultOpen?: boolean;
}

function NavGroup({ label, items, defaultOpen = true }: NavGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const hasActiveItem = items.some((item) => location.pathname === item.url);

  return (
    <Collapsible open={isOpen || hasActiveItem} onOpenChange={setIsOpen}>
      <SidebarGroup>
        {!collapsed && (
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="flex cursor-pointer items-center justify-between text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
              <span>{label}</span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </SidebarGroupLabel>
          </CollapsibleTrigger>
        )}
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground/80 transition-all duration-200",
                        "hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                      activeClassName="bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar
      className="border-r border-sidebar-border"
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-accent shadow-accent-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-heading font-bold text-sidebar-foreground">
                Oxy People
              </span>
              <span className="text-xs text-sidebar-foreground/60">
                Gestão de Pessoas
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <NavGroup label="Principal" items={mainNavItems} />
        <NavGroup label="Engajamento" items={engagementItems} />
        <NavGroup label="Gestão" items={managementItems} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 ring-2 ring-sidebar-primary/20">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground">
              U
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                Usuário
              </span>
              <span className="truncate text-xs text-sidebar-foreground/60">
                usuario@empresa.com
              </span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
