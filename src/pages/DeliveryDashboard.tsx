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
  Home,
  CreditCard,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Clock
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
  { id: "dashboard", title: "Visão Geral", icon: Home },
  { id: "menu", title: "Cardápio", icon: MenuIcon },
  { id: "orders", title: "Pedidos", icon: Package },
  { id: "analytics", title: "Relatórios", icon: BarChart3 },
  { id: "settings", title: "Configurações", icon: SettingsIcon },
];

function DashboardOverview() {
  return (
    <div className="space-y-8">
      {/* Alert para planos */}
      <Alert className="border-orange-200 bg-orange-50">
        <CreditCard className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          Para usar todas as funcionalidades do cardápio e pedidos, você precisa assinar um plano. 
          <Button variant="link" className="ml-2 h-auto p-0 text-orange-600 hover:text-orange-700 underline" onClick={() => window.open('/', '_blank')}>
            Ver planos disponíveis
          </Button>
        </AlertDescription>
      </Alert>

      {/* KPI Cards - Grid responsivo */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <Card className="gradient-primary text-white border-none shadow-medium hover:shadow-strong transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium opacity-90">
              Total de Pedidos
            </CardTitle>
            <Package className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">0</div>
            <p className="text-xs opacity-80 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-medium hover:shadow-strong transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium opacity-90">
              Receita Total
            </CardTitle>
            <DollarSign className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">R$ 0,00</div>
            <p className="text-xs opacity-80 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-medium hover:shadow-strong transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium opacity-90">
              Itens do Cardápio
            </CardTitle>
            <MenuIcon className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">0</div>
            <p className="text-xs opacity-80 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Produtos cadastrados
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none shadow-medium hover:shadow-strong transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium opacity-90">
              Status do Delivery
            </CardTitle>
            <Badge variant="secondary" className="bg-white/20 text-white border-none">
              Online
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-300 mb-2">Ativo</div>
            <p className="text-xs opacity-80 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Funcionando normalmente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards informativos */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-soft border-orange-100">
          <CardHeader>
            <CardTitle className="text-xl text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Primeiros Passos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
              <div>
                <p className="font-medium text-foreground">Configure seu cardápio</p>
                <p className="text-sm text-muted-foreground">Adicione produtos e categorias</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground text-sm font-bold">2</div>
              <div>
                <p className="font-medium text-muted-foreground">Personalize as configurações</p>
                <p className="text-sm text-muted-foreground">Defina horários e formas de pagamento</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground text-sm font-bold">3</div>
              <div>
                <p className="font-medium text-muted-foreground">Comece a receber pedidos</p>
                <p className="text-sm text-muted-foreground">Compartilhe o link do seu delivery</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-orange-100">
          <CardHeader>
            <CardTitle className="text-xl text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Nenhum pedido ainda</p>
                <p className="text-sm">Os pedidos aparecerão aqui quando chegarem</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
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
    <div className="min-h-screen w-full bg-gray-50/50">
      {/* Header Clean e Moderno */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-200 shadow-soft">
        <div className="flex h-full items-center px-6">
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-9 w-9 p-0 hover:bg-orange-50 hover:text-primary"
            >
              <MenuIcon className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">
                {menuItems.find(item => item.id === activeView)?.title || "Dashboard"}
              </h1>
              <p className="text-sm text-gray-600 hidden sm:block">
                Bem-vindo, {user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Button 
              variant="outline" 
              onClick={handleSignOut} 
              className="flex items-center gap-2 border-gray-300 hover:bg-orange-50 hover:border-primary hover:text-primary transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay Mobile */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      {/* Sidebar Clean */}
      <aside className={cn(
        "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 shadow-soft transform transition-all duration-300 ease-in-out lg:translate-x-0",
        sidebarCollapsed ? "-translate-x-full lg:w-16" : "translate-x-0 w-64"
      )}>
        <nav className="p-4">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start transition-all font-medium h-11",
                  activeView === item.id 
                    ? "gradient-primary text-white shadow-medium hover:opacity-90" 
                    : "hover:bg-orange-50 hover:text-primary text-gray-700",
                  sidebarCollapsed ? "px-2 lg:flex hidden" : "px-4"
                )}
                onClick={() => {
                  setActiveView(item.id);
                  if (window.innerWidth < 1024) setSidebarCollapsed(true);
                }}
              >
                <item.icon className={cn(
                  "h-5 w-5", 
                  !sidebarCollapsed && "mr-3"
                )} />
                {!sidebarCollapsed && <span>{item.title}</span>}
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
        <div className="w-full p-6 max-w-none">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}