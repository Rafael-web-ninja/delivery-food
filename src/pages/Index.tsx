import { useAuthWithRole } from '@/hooks/useAuthWithRole';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Index = () => {
  // ALL HOOKS MUST BE CALLED AT THE TOP - NO CONDITIONAL HOOKS
  const { user } = useAuthWithRole();
  const navigate = useNavigate();

  // EFFECT ALWAYS RUNS - CONDITIONAL LOGIC INSIDE
  useEffect(() => {
    // AuthGate handles authentication, we just redirect authenticated users to dashboard
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // CONDITIONAL RENDERING AFTER ALL HOOKS
  // If user exists, useEffect will redirect, but we still render until redirect happens

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
