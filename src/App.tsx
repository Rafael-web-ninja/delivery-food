import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";
import AuthGate from "@/components/AuthGate";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import NotificationsListener from "@/components/NotificationsListener";
import { NotificationProvider } from "@/components/NotificationProvider";

import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Index from "./pages/Index";
import Demo from "./pages/Demo";
import Dashboard from "./pages/Dashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerProfile from "./pages/CustomerProfile";
import { DashboardRouter } from "./components/DashboardRouter";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthErrorBoundary>
      <AuthProvider>
        <SubscriptionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <NotificationsListener />
          <NotificationProvider />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AuthGate requireAuth={false}><Index /></AuthGate>} />
              <Route path="/demo" element={<AuthGate requireAuth={false}><Demo /></AuthGate>} />
              <Route path="/auth" element={<AuthGate requireAuth={false}><Auth /></AuthGate>} />
              <Route path="/reset-password" element={<AuthGate requireAuth={false}><ResetPassword /></AuthGate>} />
              <Route path="/termos" element={<AuthGate requireAuth={false}><TermsOfService /></AuthGate>} />
              <Route path="/privacidade" element={<AuthGate requireAuth={false}><PrivacyPolicy /></AuthGate>} />
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
                <Route path="/subscription" element={
                  <ProtectedRoute requiredUserType="delivery_owner">
                    <SubscriptionManagement />
                  </ProtectedRoute>
                } />
              </Route>
              
              {/* Success after Stripe checkout */}
              <Route path="/test-notifications" element={<TestNotifications />} />
              <Route path="/test-checkout" element={<AuthGate requireAuth={false}><TestCheckout /></AuthGate>} />
              <Route path="/subscription-success" element={<AuthGate requireAuth={false}><SubscriptionSuccess /></AuthGate>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<AuthGate requireAuth={false}><NotFound /></AuthGate>} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </AuthErrorBoundary>
  </QueryClientProvider>
);

export default App;
