import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Settings as SettingsIcon, 
  Package, 
  BarChart3, 
  Menu,
  LogOut,
  Bell
} from "lucide-react";
import { useAuthWithRole } from "@/hooks/useAuthWithRole";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

import MenuManagement from "@/pages/MenuManagement";
import OrderManagement from "@/pages/OrderManagement";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import { NotificationBell } from "@/components/NotificationBell";

export default function DeliveryDashboard() {
  const { user, signOut } = useAuthWithRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout",
        variant: "destructive"
      });
    } else {
      navigate('/');
      toast({
        title: "Sucesso",
        description: "Logout realizado com sucesso"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Painel do Delivery</h1>
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
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <Menu className="h-4 w-4" />
              Cardápio
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

           <TabsContent value="dashboard">
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
                   <Menu className="h-4 w-4 text-muted-foreground" />
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
                   <Bell className="h-4 w-4 text-muted-foreground" />
                 </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold text-green-600">Ativo</div>
                   <p className="text-xs text-muted-foreground">
                     Delivery funcionando
                   </p>
                 </CardContent>
               </Card>
             </div>
           </TabsContent>

          <TabsContent value="menu">
            <MenuManagement />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>

          <TabsContent value="settings">
            <Settings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}