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
        
        // Verificar se é dono de um delivery business
        const { data: business, error } = await supabase
          .from('delivery_businesses')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('DashboardRouter: Error checking business:', error);
          setUserType('customer');
        } else if (business && business.id) {
          console.log('DashboardRouter: User has business, routing to business dashboard');
          setUserType('business');
        } else {
          // Verificar se tem metadata indicando que é business owner
          const userType = user.user_metadata?.user_type;
          if (userType === 'delivery_owner') {
            console.log('DashboardRouter: User metadata indicates delivery_owner, routing to business dashboard');
            setUserType('business');
          } else {
            console.log('DashboardRouter: No business found, routing to customer dashboard');
            setUserType('customer');
          }
        }
      } catch (error) {
        console.error('DashboardRouter: Exception checking user type:', error);
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