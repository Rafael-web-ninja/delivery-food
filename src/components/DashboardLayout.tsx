import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { NotificationBell } from '@/components/NotificationBell';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const DashboardLayout = () => {
  const { user, signOut, loading, initialized } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Não mostrar o layout nas páginas públicas
  const isPublicRoute = location.pathname.startsWith('/menu/') || 
                       location.pathname === '/auth' || 
                       location.pathname === '/';

  useEffect(() => {
    console.log('DashboardLayout: Auth state -', {
      user: user?.email || 'null',
      loading,
      initialized,
      isPublicRoute
    });

    // Só redirecionar quando a auth estiver inicializada
    if (initialized && !loading && !user && !isPublicRoute) {
      console.log('DashboardLayout: Redirecting to auth');
      navigate('/auth', { replace: true });
    }
  }, [user, loading, initialized, isPublicRoute, navigate]);

  // Sempre permitir rotas públicas
  if (isPublicRoute) {
    return <Outlet />;
  }

  // Mostrar loading enquanto a auth não estiver inicializada
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner />
          <p className="text-muted-foreground text-sm">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado e não for rota pública, não renderizar nada
  // (o useEffect vai redirecionar)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">DeliveryFácil</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              {user && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-2"
                  >
                    <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-medium">
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm hidden md:block">{user.email}</span>
                  </Button>
                  <Button variant="outline" onClick={signOut} size="sm">
                    Sair
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;