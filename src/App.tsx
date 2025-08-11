import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";
import AuthGate from "@/components/AuthGate";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerProfile from "./pages/CustomerProfile";
import { DashboardRouter } from "./components/DashboardRouter";
import MenuManagement from "./pages/MenuManagement";
import OrderManagement from "./pages/OrderManagement";
import PublicMenu from "./pages/PublicMenu";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import PDV from "./pages/PDV";

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
              <Route path="/:businessId" element={<AuthGate requireAuth={false}><PublicMenu /></AuthGate>} />
              
              {/* Customer Routes */}
              <Route path="/meu-perfil" element={
                <ProtectedRoute requiredUserType="customer">
                  <CustomerDashboard />
                </ProtectedRoute>
              } />
              
              {/* Business Owner Routes */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={
                  <ProtectedRoute requiredUserType="delivery_owner">
                    <DashboardRouter />
                  </ProtectedRoute>
                } />
                <Route path="/menu" element={
                  <ProtectedRoute requiredUserType="delivery_owner">
                    <MenuManagement />
                  </ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute requiredUserType="delivery_owner">
                    <OrderManagement />
                  </ProtectedRoute>
                } />
                <Route path="/pdv" element={
                  <ProtectedRoute requiredUserType="delivery_owner">
                    <PDV />
                  </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                  <ProtectedRoute requiredUserType="delivery_owner">
                    <Analytics />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute requiredUserType="delivery_owner">
                    <Settings />
                  </ProtectedRoute>
                } />
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
