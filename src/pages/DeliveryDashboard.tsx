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

function Sidebar({ activeView, onViewChange, collapsed, onToggle }: { 
  activeView: string; 
  onViewChange: (view: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={cn(
      "bg-card border-r transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-16 items-center border-b px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0"
        >
          <MenuIcon className="h-4 w-4" />
        </Button>
        {!collapsed && (
          <h2 className="ml-3 text-lg font-semibold">DeliveryFácil</h2>
        )}
      </div>
      
      <nav className="p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeView === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                collapsed ? "px-2" : "px-4"
              )}
              onClick={() => onViewChange(item.id)}
            >
              <item.icon className={cn("h-4 w-4", !collapsed && "mr-3")} />
              {!collapsed && <span>{item.title}</span>}
            </Button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function DashboardOverview() {
  return (
    <>
      {/* Alert para planos */}
      <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-800">
        <CreditCard className="h-4 w-4" />
        <AlertDescription>
          Para usar todas as funcionalidades do cardápio e pedidos, você precisa assinar um plano. 
          <Button variant="link" className="ml-2 h-auto p-0 text-amber-800 underline">
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
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <main className="flex-1">
        {/* Header */}
        <div className="border-b bg-card shadow-sm">
          <div className="flex h-16 items-center px-6">
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">
                {menuItems.find(item => item.id === activeView)?.title || "Dashboard"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Bem-vindo, {user?.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />
              <Button variant="outline" onClick={handleSignOut} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}