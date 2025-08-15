import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'customer' | 'delivery_owner';
}

const ProtectedRoute = ({ children, requiredUserType }: ProtectedRouteProps) => {
  const { user, loading, initialized } = useAuth();
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'customer' | 'delivery_owner' | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkUserAccess = async () => {
      if (!initialized || loading) return;

      if (!user) {
        navigate('/auth');
        return;
      }

      try {
        // Primeiro verificar nos metadados do usuário
        const metadata = user.user_metadata;
        let detectedUserType = metadata?.user_type;

        // Se não tiver nos metadados, verificar na database
        if (!detectedUserType) {
          const { data: business } = await supabase
            .from('delivery_businesses')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle();

          detectedUserType = business ? 'delivery_owner' : 'customer';
        }

        setUserType(detectedUserType);

        // Verificar se o usuário pode acessar esta rota
        if (requiredUserType && detectedUserType !== requiredUserType) {
          if (detectedUserType === 'customer') {
            navigate('/meu-perfil', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
          return;
        }

        setChecking(false);
      } catch (error) {
        console.error('Erro ao verificar tipo de usuário:', error);
        // Em caso de erro, assumir cliente
        setUserType('customer');
        if (requiredUserType === 'delivery_owner') {
          navigate('/meu-perfil', { replace: true });
          return;
        }
        setChecking(false);
      }
    };

    checkUserAccess();
  }, [user, loading, initialized, navigate, requiredUserType]);

  if (!initialized || loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null; // Vai redirecionar via useEffect
  }

  return <>{children}</>;
};

export default ProtectedRoute;