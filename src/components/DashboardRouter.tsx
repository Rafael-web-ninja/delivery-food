import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Dashboard from '@/pages/Dashboard';
import CustomerDashboard from '@/pages/CustomerDashboard';

export const DashboardRouter = () => {
  const { user } = useAuth();
  const [userType, setUserType] = useState<'business' | 'customer' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserType = async () => {
      if (!user) return;

      try {
        console.log('DashboardRouter: Checking user type for:', user.email);
        
        // First check user metadata for quick determination
        const userType = user.user_metadata?.user_type;
        if (userType === 'delivery_owner') {
          console.log('DashboardRouter: User metadata indicates delivery_owner, routing to business dashboard');
          setUserType('business');
          setLoading(false);
          return;
        }
        
        // Only query database if metadata doesn't indicate business owner
        // Use the new secure function instead of direct table query
        const { data: businessId, error } = await supabase
          .rpc('get_user_business_id');

        if (error) {
          console.error('DashboardRouter: Error checking business ownership:', error);
          // Default to customer on any error to prevent infinite loops
          setUserType('customer');
        } else if (businessId) {
          console.log('DashboardRouter: User owns business, routing to business dashboard');
          setUserType('business');
        } else {
          console.log('DashboardRouter: No business found, routing to customer dashboard');
          setUserType('customer');
        }
      } catch (error) {
        console.error('DashboardRouter: Exception checking user type:', error);
        // Always default to customer on errors to prevent app from breaking
        setUserType('customer');
      } finally {
        setLoading(false);
      }
    };

    checkUserType();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return userType === 'business' ? <Dashboard /> : <CustomerDashboard />;
};