import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import CustomerDashboard from '@/pages/CustomerDashboard';
import { Navigate } from 'react-router-dom';

export const CustomerNavigation = () => {
  const { user } = useAuth();
  const [isBusinessOwner, setIsBusinessOwner] = useState<boolean | null>(null);

  useEffect(() => {
    const checkBusinessOwner = async () => {
      if (!user) return;

      // Check user metadata first
      const userType = user.user_metadata?.user_type;
      if (userType === 'delivery_owner') {
        setIsBusinessOwner(true);
        return;
      }

      // Check if user owns a business
      try {
        const { data: business } = await supabase
          .from('delivery_businesses')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle();

        setIsBusinessOwner(!!business);
      } catch (error) {
        console.error('Error checking business ownership:', error);
        setIsBusinessOwner(false);
      }
    };

    checkBusinessOwner();
  }, [user]);

  // Redirect business owners to dashboard
  if (isBusinessOwner === true) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show customer dashboard for non-business owners
  if (isBusinessOwner === false) {
    return <CustomerDashboard />;
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-xl text-muted-foreground">Carregando...</p>
    </div>
  );
};