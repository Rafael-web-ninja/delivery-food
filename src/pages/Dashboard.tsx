import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CardSkeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Plus, Store, Package, ShoppingCart, Copy, Link, BarChart3, TrendingUp, Clock, CheckCircle, Menu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NotificationBell } from '@/components/NotificationBell';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';
import { Sidebar } from '@/components/Sidebar';

interface Business {
  id: string;
  name: string;
  description: string;
  phone: string;
  address: string;
}

const Dashboard = () => {
  const { user, signOut, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [menuLink, setMenuLink] = useState<string>('');
  const [stats, setStats] = useState({
    totalItems: 0,
    totalOrders: 0,
    pendingOrders: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { execute: executeCopyLink, loading: copyingLink } = useAsyncOperation({
    successMessage: "Link copiado com sucesso!"
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
    setLoadingBusiness(true);
    try {
      const { data, error } = await supabase
        .from('delivery_businesses')
        .select('*')
        .single();

      if (data) {
        setBusiness(data);
        setMenuLink(`${window.location.origin}/menu/${data.id}`);
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
        
        if (newBusiness) {
          setBusiness(newBusiness);
          setMenuLink(`${window.location.origin}/menu/${newBusiness.id}`);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar business:', error);
    } finally {
      setLoadingBusiness(false);
    }
  };

  const copyMenuLink = async () => {
    await executeCopyLink(async () => {
      if (!menuLink) throw new Error('Link não disponível');
      await navigator.clipboard.writeText(menuLink);
    });
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
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
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoadingStats(false);
    }
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
    <div className="px-4 py-8">
      <div className="grid gap-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-muted-foreground">
            Gerencie seu delivery e acompanhe suas vendas
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loadingStats ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            <>
              <Card className="shadow-soft hover:shadow-medium transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Itens do Cardápio
                  </CardTitle>
                  <Package className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.totalItems}</div>
                  <p className="text-xs text-muted-foreground">
                    Total de itens cadastrados
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-medium transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pedidos Totais
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    Pedidos realizados
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-soft hover:shadow-medium transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pedidos Pendentes
                  </CardTitle>
                  <Clock className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-warning">{stats.pendingOrders}</div>
                    {stats.pendingOrders > 0 && (
                      <Badge variant="destructive" className="animate-pulse-soft">
                        Urgente!
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Aguardando preparo
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-soft hover:shadow-medium transition-smooth cursor-pointer animate-fade-in" onClick={() => navigate('/menu')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Gerenciar Cardápio
                </CardTitle>
                <CardDescription>
                  Adicione, edite e organize os itens do seu cardápio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="premium">
                  <Plus className="h-4 w-4 mr-2" />
                  Gerenciar Itens
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-smooth cursor-pointer animate-fade-in" onClick={() => navigate('/orders')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Pedidos
                  {stats.pendingOrders > 0 && (
                    <Badge variant="destructive" className="ml-2 animate-pulse-soft">
                      {stats.pendingOrders}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Acompanhe e gerencie os pedidos dos seus clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant={stats.pendingOrders > 0 ? "warning" : "secondary"}>
                  {stats.pendingOrders > 0 ? (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Ver Pendentes
                    </>
                  ) : (
                    "Ver Pedidos"
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-smooth cursor-pointer animate-fade-in" onClick={() => navigate('/analytics')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Analytics
                </CardTitle>
                <CardDescription>
                  Visualize relatórios de vendas e performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Ver Relatórios
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-soft hover:shadow-medium transition-smooth cursor-pointer animate-fade-in" onClick={() => navigate('/settings')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
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

        {/* Menu Link Section */}
        {menuLink && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Link do seu Cardápio
              </CardTitle>
              <CardDescription>
                Compartilhe este link nas suas redes sociais para que os clientes vejam seu cardápio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm">
                  {menuLink}
                </div>
                <LoadingButton 
                  onClick={copyMenuLink} 
                  variant="outline"
                  loading={copyingLink}
                  loadingText="Copiando..."
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </LoadingButton>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Cole este link no WhatsApp, Instagram, Facebook ou onde preferir!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;