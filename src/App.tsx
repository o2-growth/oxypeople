import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteFallback } from "@/components/RouteFallback";

const Index = lazy(() => import("./pages/Index"));
const Feed = lazy(() => import("./pages/Feed"));
const Auth = lazy(() => import("./pages/Auth"));
const Recognition = lazy(() => import("./pages/Recognition"));
const Objectives = lazy(() => import("./pages/Objectives"));
const ObjectiveDetail = lazy(() => import("./pages/ObjectiveDetail"));
const Surveys = lazy(() => import("./pages/Surveys"));
const Company = lazy(() => import("./pages/Company"));
const Settings = lazy(() => import("./pages/Settings"));
const Automation = lazy(() => import("./pages/Automation"));
const Teams = lazy(() => import("./pages/Teams"));
const Performance = lazy(() => import("./pages/Performance"));
const Gamification = lazy(() => import("./pages/Gamification"));
const HR = lazy(() => import("./pages/HR"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ErrorBoundary>
            <BrowserRouter>
              <Suspense fallback={<RouteFallback />}>
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
              </Suspense>
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
