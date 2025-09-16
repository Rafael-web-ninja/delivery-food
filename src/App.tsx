import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";
import NotificationsListener from "@/components/NotificationsListener";
import { NotificationProvider } from '@/components/NotificationProvider';
import { AppContent } from '@/components/AppContent';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthErrorBoundary>
        <AuthProvider>
          <SubscriptionProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <NotificationsListener />
              <NotificationProvider />
              <AppContent />
            </TooltipProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </AuthErrorBoundary>
    </QueryClientProvider>
  );
};

export default App;
