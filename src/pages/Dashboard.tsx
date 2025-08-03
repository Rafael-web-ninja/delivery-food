import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Store, Package, ShoppingCart } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  description: string;
  phone: string;
  address: string;
}

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalOrders: 0,
    pendingOrders: 0
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBusiness();
      fetchStats();
    }
  }, [user]);

  const fetchBusiness = async () => {
    const { data, error } = await supabase
      .from('delivery_businesses')
      .select('*')
      .single();

    if (data) {
      setBusiness(data);
    } else if (error) {
      // Criar business se não existir
      const { data: newBusiness } = await supabase
        .from('delivery_businesses')
        .insert({
          owner_id: user?.id,
          name: user?.user_metadata?.business_name || 'Meu Delivery',
          description: 'Descrição do delivery'
        })
        .select()
        .single();
      
      if (newBusiness) setBusiness(newBusiness);
    }
  };

  const fetchStats = async () => {
    const [itemsResult, ordersResult, pendingResult] = await Promise.all([
      supabase.from('menu_items').select('id', { count: 'exact' }),
      supabase.from('orders').select('id', { count: 'exact' }),
      supabase.from('orders').select('id', { count: 'exact' }).eq('status', 'pending')
    ]);

    setStats({
      totalItems: itemsResult.count || 0,
      totalOrders: ordersResult.count || 0,
      pendingOrders: pendingResult.count || 0
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">DeliveryFácil</h1>
            {business && (
              <p className="text-sm text-muted-foreground">{business.name}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
            <Button variant="outline" onClick={signOut}>
              Sair
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
            <p className="text-muted-foreground">
              Gerencie seu delivery e acompanhe suas vendas
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Itens do Cardápio
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalItems}</div>
                <p className="text-xs text-muted-foreground">
                  Total de itens cadastrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pedidos Totais
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Pedidos realizados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pedidos Pendentes
                </CardTitle>
                <Badge variant="destructive" className="h-4 w-4 rounded-full p-0">
                  {stats.pendingOrders}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Aguardando preparo
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/menu')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Gerenciar Cardápio
                </CardTitle>
                <CardDescription>
                  Adicione, edite e organize os itens do seu cardápio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Gerenciar Itens
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/orders')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Pedidos
                </CardTitle>
                <CardDescription>
                  Acompanhe e gerencie os pedidos dos seus clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="secondary">
                  Ver Pedidos
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/settings')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Configurações
                </CardTitle>
                <CardDescription>
                  Configure as informações do seu delivery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  Configurar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;