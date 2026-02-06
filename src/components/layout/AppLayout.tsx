import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PendingFeedbackBanner } from "@/components/people/PendingFeedbackBanner";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          {/* Top Header */}
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur-md px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-9 w-9" />
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar pessoas, posts, objetivos..."
                  className="w-80 pl-10 bg-secondary/50 border-transparent focus:border-primary/30 focus:bg-background transition-all"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
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
