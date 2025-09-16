import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useFirstLogin } from '@/hooks/useFirstLogin';
import { FirstLoginPasswordChange } from '@/components/FirstLoginPasswordChange';
import AuthGate from "@/components/AuthGate";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardRouter } from "./DashboardRouter";

import Auth from "../pages/Auth";
import ResetPassword from "../pages/ResetPassword";
import Index from "../pages/Index";
import Demo from "../pages/Demo";
import Dashboard from "../pages/Dashboard";
import CustomerDashboard from "../pages/CustomerDashboard";
import CustomerProfile from "../pages/CustomerProfile";
import MenuManagement from "../pages/MenuManagement";
import OrderManagement from "../pages/OrderManagement";
import PublicMenu from "../pages/PublicMenu";
import Analytics from "../pages/Analytics";
import Settings from "../pages/Settings";
import NotFound from "../pages/NotFound";
import PDV from "../pages/PDV";
import SubscriptionManagement from "../pages/SubscriptionManagement";
import TestNotifications from "../pages/TestNotifications";
import SubscriptionSuccess from "../pages/SubscriptionSuccess";
import TermsOfService from "../pages/TermsOfService";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import TestCheckout from "../pages/TestCheckout";

export const AppContent = () => {
  const { 
    showPasswordChange, 
    handlePasswordChangeComplete, 
    handleSkipPasswordChange 
  } = useFirstLogin();

  return (
    <>
      <FirstLoginPasswordChange
        isOpen={showPasswordChange}
        onClose={handlePasswordChangeComplete}
        onSkip={handleSkipPasswordChange}
      />
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
    </>
  );
};