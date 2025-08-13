import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { NotificationBell } from '@/components/NotificationBell';
const DashboardLayout = () => {
  const {
    user,
    signOut
  } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  // AuthGate já garante que só usuarios autenticados chegam aqui

  return <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <img 
                  src="/lovable-uploads/e3282e15-f7f7-4c67-8089-4b56167f770b.png" 
                  alt="Gera Cardápio" 
                  className="h-8 w-auto"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              {user && <>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => navigate('/settings')}>
                    <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-medium">
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm hidden md:block">{user.email}</span>
                  </Button>
                  <Button variant="outline" onClick={signOut} size="sm" className="hover:bg-primary hover:text-primary-foreground">
                    Sair
                  </Button>
                </>}
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>;
};
export default DashboardLayout;