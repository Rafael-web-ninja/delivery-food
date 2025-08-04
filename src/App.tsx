import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";
import AuthGate from "@/components/AuthGate";
import DashboardLayout from "@/components/DashboardLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import MenuManagement from "./pages/MenuManagement";
import OrderManagement from "./pages/OrderManagement";
import PublicMenu from "./pages/PublicMenu";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthErrorBoundary>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AuthGate requireAuth={false}><Index /></AuthGate>} />
              <Route path="/auth" element={<AuthGate requireAuth={false}><Auth /></AuthGate>} />
              <Route path="/menu/:businessId" element={<AuthGate requireAuth={false}><PublicMenu /></AuthGate>} />
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<AuthGate><Dashboard /></AuthGate>} />
                <Route path="/menu" element={<AuthGate><MenuManagement /></AuthGate>} />
                <Route path="/orders" element={<AuthGate><OrderManagement /></AuthGate>} />
                <Route path="/analytics" element={<AuthGate><Analytics /></AuthGate>} />
                <Route path="/settings" element={<AuthGate><Settings /></AuthGate>} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<AuthGate requireAuth={false}><NotFound /></AuthGate>} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </AuthErrorBoundary>
  </QueryClientProvider>
);

export default App;
