import { lazy, Suspense, useEffect } from "react";
import { checkForUpdates } from "@/lib/checkForUpdates";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/app/AppLayout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import Dashboard from "@/pages/app/Dashboard";
import Clients from "@/pages/app/Clients";
import ClientDetails from "@/pages/app/ClientDetails";
import Compliance from "@/pages/app/Compliance";
import NotFound from "./pages/NotFound";

const Calculators = lazy(() => import("@/pages/app/Calculators"));
const CalculatorDetail = lazy(() => import("@/pages/app/CalculatorDetail"));
const CalculatorHub = lazy(() => import("@/pages/app/CalculatorHub"));
const Settings = lazy(() => import("@/pages/app/Settings"));
const Pricing = lazy(() => import("@/pages/Pricing"));

const queryClient = new QueryClient();

const LazyFallback = (
  <div style={{
    display: "flex", alignItems: "center",
    justifyContent: "center", height: "100vh",
    color: "var(--text-tertiary)", fontSize: "14px",
  }}>
    Loading...
  </div>
);

// Fires the updater exactly once, only after the user is signed in,
// so the native confirm dialog never overlaps the login screen.
function UpdateChecker() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      checkForUpdates();
    }
  }, [user, loading]);

  return null;
}

const App = () => {
  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <UpdateChecker />
      <WorkspaceProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={LazyFallback}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/pricing" element={<Pricing />} />

                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/calculators" element={<CalculatorHub />} />
                  <Route path="/calculators/:category" element={<Calculators />} />
                  <Route path="/calculator/:slug" element={<CalculatorDetail />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/clients/:id" element={<ClientDetails />} />
                  <Route path="/compliance" element={<Compliance />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </WorkspaceProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
