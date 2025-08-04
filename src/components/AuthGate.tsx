import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AuthGateProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export default function AuthGate({ children, requireAuth = true }: AuthGateProps) {
  const { user, loading, initialized } = useAuth();
  const navigate = useNavigate();

  // 1. Loading state - aguardando inicialização
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground text-sm">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // 2. Usuário não logado - redirecionar para auth
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Acesso Restrito</h2>
          <p className="text-muted-foreground">Você precisa estar logado para acessar esta página.</p>
          <Button onClick={() => navigate('/auth')}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  // 3. Usuário autenticado ou não requer auth - renderizar conteúdo
  return <>{children}</>;
}