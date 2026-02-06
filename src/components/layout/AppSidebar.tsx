import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  Zap,
  UsersRound,
  ClipboardCheck,
  Gamepad2,
  Briefcase,
  LogOut,
  User,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/contexts/AuthContext";

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
  const navigate = useNavigate();
  const { profile } = useUser();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Usuário";
  const displayEmail = user?.email || "usuario@empresa.com";
  const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || "user"}`;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Sidebar
      className="border-r border-sidebar-border"
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-[0_0_15px_hsla(142,71%,50%,0.5)]">
            <span className="text-lg font-bold text-primary-foreground">O₂</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-heading font-bold text-sidebar-foreground">
                Oxy People
              </span>
              <span className="text-xs text-sidebar-foreground/60">
                by O2 Inc
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-1 transition-colors hover:bg-sidebar-accent focus:outline-none focus:ring-2 focus:ring-sidebar-primary/20">
              <Avatar className="h-9 w-9 ring-2 ring-sidebar-primary/20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col overflow-hidden text-left">
                  <span className="truncate text-sm font-medium text-sidebar-foreground">
                    {displayName}
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/60">
                    {displayEmail}
                  </span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <User className="mr-2 h-4 w-4" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme}>
              {theme === "dark" ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
