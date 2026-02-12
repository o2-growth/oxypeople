import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Feed from "./pages/Feed";

import Auth from "./pages/Auth";
import Recognition from "./pages/Recognition";
import Objectives from "./pages/Objectives";
import ObjectiveDetail from "./pages/ObjectiveDetail";
import Surveys from "./pages/Surveys";
import Company from "./pages/Company";
import Settings from "./pages/Settings";
import Automation from "./pages/Automation";
import Teams from "./pages/Teams";
import Performance from "./pages/Performance";
import Gamification from "./pages/Gamification";
import HR from "./pages/HR";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
              
              <Route path="/recognition" element={<ProtectedRoute><Recognition /></ProtectedRoute>} />
              <Route path="/objectives" element={<ProtectedRoute><Objectives /></ProtectedRoute>} />
              <Route path="/objectives/:id" element={<ProtectedRoute><ObjectiveDetail /></ProtectedRoute>} />
              <Route path="/surveys" element={<ProtectedRoute><Surveys /></ProtectedRoute>} />
              <Route path="/company" element={<ProtectedRoute><Company /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/automation" element={<ProtectedRoute><Automation /></ProtectedRoute>} />
              <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
              <Route path="/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
              <Route path="/gamification" element={<ProtectedRoute><Gamification /></ProtectedRoute>} />
              <Route path="/hr" element={<ProtectedRoute><HR /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
