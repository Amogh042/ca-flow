import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CountryProvider } from "@/contexts/CountryContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { AppLayout } from "@/components/app/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import Dashboard from "@/pages/app/Dashboard";
import Calculators from "@/pages/app/Calculators";
import CalculatorDetail from "@/pages/app/CalculatorDetail";
import Clients from "@/pages/app/Clients";
import ClientDetails from "@/pages/app/ClientDetails";
import Compliance from "@/pages/app/Compliance";
import CalcAI from "@/pages/app/CalcAI";
import Documents from "@/pages/app/Documents";
import DocumentDetails from "@/pages/app/DocumentDetails";
import Settings from "@/pages/app/Settings";
import Workflows from "@/pages/app/Workflows";
import Reports from "@/pages/app/Reports";
import Placeholder from "@/pages/app/Placeholder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WorkspaceProvider>
        <CountryProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/calculators/:category" element={<Calculators />} />
                <Route path="/calculator/:slug" element={<CalculatorDetail />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/clients/:id" element={<ClientDetails />} />
                <Route path="/workflows" element={<Workflows />} />
                <Route path="/compliance" element={<Compliance />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/documents/:id" element={<DocumentDetails />} />
                <Route path="/ai" element={<CalcAI />} />
                <Route path="/history" element={<Placeholder title="History" />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CountryProvider>
    </WorkspaceProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
