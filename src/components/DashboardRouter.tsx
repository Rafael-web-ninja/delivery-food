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
        // Verificar se é dono de um delivery business
        const { data: business } = await supabase
          .from('delivery_businesses')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (business) {
          setUserType('business');
        } else {
          setUserType('customer');
        }
      } catch (error) {
        // Se não encontrou business, é cliente
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