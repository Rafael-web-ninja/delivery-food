import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { RoleBasedRedirect } from "@/components/RoleBasedRedirect";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import ClientDashboard from "@/pages/ClientDashboard";
import DeliveryDashboard from "@/pages/DeliveryDashboard";
import PublicMenu from "@/pages/PublicMenu";
import NotFound from "@/pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/menu/:businessId" element={<PublicMenu />} />
          
          {/* Client Dashboard - Only for clients */}
          <Route 
            path="/painel-cliente" 
            element={
              <RoleBasedRedirect allowedRoles={['cliente']}>
                <ClientDashboard />
              </RoleBasedRedirect>
            } 
          />
          
          {/* Delivery Dashboard - Only for delivery owners */}
          <Route 
            path="/painel-delivery" 
            element={
              <RoleBasedRedirect allowedRoles={['dono_delivery']}>
                <DeliveryDashboard />
              </RoleBasedRedirect>
            } 
          />

          {/* Legacy dashboard route - redirects based on role */}
          <Route 
            path="/dashboard" 
            element={
              <RoleBasedRedirect>
                <div>Redirecionando...</div>
              </RoleBasedRedirect>
            } 
          />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
