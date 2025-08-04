import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Index = () => {
  console.log('Index render start');
  const { user } = useAuth();
  console.log('Index useAuth result:', { user: !!user });
  const navigate = useNavigate();

  // AuthGate handles authentication, we just redirect authenticated users to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">DeliveryFácil</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Plataforma completa para gestão do seu delivery
        </p>
        <Button onClick={() => navigate('/auth')}>
          Começar
        </Button>
      </div>
    </div>
  );
};

export default Index;
