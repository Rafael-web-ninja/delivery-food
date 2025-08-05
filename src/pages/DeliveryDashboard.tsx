import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings as SettingsIcon, 
  Package, 
  BarChart3, 
  Menu as MenuIcon,
  LogOut,
  Bell,
  Home,
  CreditCard
} from "lucide-react";
import { useAuthWithRole } from "@/hooks/useAuthWithRole";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import MenuManagement from "@/pages/MenuManagement";
import OrderManagement from "@/pages/OrderManagement";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import { NotificationBell } from "@/components/NotificationBell";

const menuItems = [
  { id: "dashboard", title: "Dashboard", icon: Home },
  { id: "menu", title: "Cardápio", icon: MenuIcon },
  { id: "orders", title: "Pedidos", icon: Package },
  { id: "analytics", title: "Relatórios", icon: BarChart3 },
  { id: "settings", title: "Configurações", icon: SettingsIcon },
];


function DashboardOverview() {
  return (
    <>
      {/* Alert para planos */}
      <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-800">
        <CreditCard className="h-4 w-4" />
        <AlertDescription>
          Para usar todas as funcionalidades do cardápio e pedidos, você precisa assinar um plano. 
              <Button variant="link" className="ml-2 h-auto p-0 text-amber-800 underline" onClick={() => window.open('/', '_blank')}>
                Ver planos disponíveis
              </Button>
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Pedidos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receita Total
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Itens do Cardápio
            </CardTitle>
            <MenuIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Produtos cadastrados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Status
            </CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Ativo
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">
              Delivery funcionando
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function DeliveryDashboard() {
  const { user, signOut } = useAuthWithRole();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao fazer logout",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Logout realizado com sucesso"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao fazer logout",
        variant: "destructive"
      });
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardOverview />;
      case "menu":
        return <MenuManagement />;
      case "orders":
        return <OrderManagement />;
      case "analytics":
        return <Analytics />;
      case "settings":
        return <Settings />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header Fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b shadow-sm">
        <div className="flex h-full items-center px-6">
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8 p-0"
            >
              <MenuIcon className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">
                {menuItems.find(item => item.id === activeView)?.title || "Dashboard"}
              </h1>
              <p className="text-sm text-gray-600">
                Bem-vindo, {user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay para Mobile */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      {/* Sidebar Fixo */}
      <aside className={cn(
        "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] bg-white border-r shadow-sm transform transition-all duration-300 ease-in-out lg:translate-x-0",
        sidebarCollapsed ? "-translate-x-full lg:w-16" : "translate-x-0 w-64"
      )}>
        <nav className="p-4">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={activeView === item.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start transition-all hover:bg-gray-100",
                  activeView === item.id && "bg-primary text-primary-foreground hover:bg-primary/90",
                  sidebarCollapsed ? "px-2 lg:flex hidden" : "px-4"
                )}
                onClick={() => {
                  setActiveView(item.id);
                  if (window.innerWidth < 1024) setSidebarCollapsed(true); // Fechar em mobile
                }}
              >
                <item.icon className={cn(
                  "h-5 w-5", 
                  !sidebarCollapsed && "mr-3",
                  activeView === item.id ? "text-primary-foreground" : "text-gray-600"
                )} />
                {!sidebarCollapsed && <span className="font-medium">{item.title}</span>}
              </Button>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main Content - Full Width */}
      <main className={cn(
        "pt-16 min-h-screen transition-all duration-300",
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        <div className="w-full max-w-none p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}