import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Search, Command } from "lucide-react";
import { PendingFeedbackBanner } from "@/components/people/PendingFeedbackBanner";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          {/* Command Bar Header */}
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 bg-background/90 backdrop-blur-xl px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-8 w-8" />
              <div className="hidden md:flex items-center gap-2 rounded-lg bg-secondary/60 border border-border/40 px-3 py-1.5 text-sm text-muted-foreground cursor-pointer hover:bg-secondary hover:border-border/60 transition-all w-72">
                <Search className="h-3.5 w-3.5 shrink-0" />
                <span className="flex-1 text-left">Buscar pessoas, posts, objetivos...</span>
                <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border/60 bg-background/80 px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationDropdown />
            </div>
          </header>
          
          {/* Pending Feedback Banner */}
          <PendingFeedbackBanner />
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
