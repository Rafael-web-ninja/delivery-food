import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, ShoppingCart, DollarSign, Clock, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import DateRangePicker from '@/components/DateRangePicker';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  salesTrend: Array<{ date: string; revenue: number; orders: number }>;
  categoryPerformance: Array<{ name: string; value: number; orders: number }>;
  orderStatus: Array<{ status: string; count: number }>;
}

const Analytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [customDateRange, setCustomDateRange] = useState<{start: string, end: string} | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchAnalytics();
  }, [user, navigate, timeRange, customDateRange]);

  const fetchAnalytics = async () => {
    try {
      let startDate: Date;
      let endDate = new Date();
      
      if (customDateRange) {
        startDate = new Date(customDateRange.start);
        endDate = new Date(customDateRange.end);
      } else {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
      }

      // Get business
      const { data: business } = await supabase
        .from('delivery_businesses')
        .select('id')
        .eq('owner_id', user?.id)
        .single();

      if (!business) return;

      // Get orders for the time range
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            unit_price,
            total_price,
            menu_item_id,
            menu_items (
              name,
              category_id,
              menu_categories (name)
            )
          )
        `)
        .eq('business_id', business.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (!orders) return;

      // Calculate analytics
      const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Sales trend by day
      const salesByDay = new Map();
      orders.forEach(order => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        if (!salesByDay.has(date)) {
          salesByDay.set(date, { revenue: 0, orders: 0 });
        }
        const day = salesByDay.get(date);
        day.revenue += Number(order.total_amount);
        day.orders += 1;
      });

      const salesTrend = Array.from(salesByDay.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Category performance
      const categoryStats = new Map();
      orders.forEach(order => {
        order.order_items?.forEach(item => {
          const category = item.menu_items?.menu_categories?.name || 'Sem categoria';
          if (!categoryStats.has(category)) {
            categoryStats.set(category, { value: 0, orders: 0 });
          }
          const stats = categoryStats.get(category);
          stats.value += Number(item.total_price);
          stats.orders += item.quantity;
        });
      });

      const categoryPerformance = Array.from(categoryStats.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.value - a.value);

      // Order status distribution
      const statusCounts = new Map();
      orders.forEach(order => {
        const status = order.status;
        statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
      });

      const orderStatus = Array.from(statusCounts.entries())
        .map(([status, count]) => ({ status, count }));

      setAnalytics({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        salesTrend,
        categoryPerformance,
        orderStatus
      });
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setCustomDateRange({ start: startDate, end: endDate });
    setTimeRange('custom');
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Analytics</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={timeRange === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setTimeRange('7d');
                setCustomDateRange(null);
              }}
            >
              7 dias
            </Button>
            <Button
              variant={timeRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setTimeRange('30d');
                setCustomDateRange(null);
              }}
            >
              30 dias
            </Button>
            <Button
              variant={timeRange === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setTimeRange('90d');
                setCustomDateRange(null);
              }}
            >
              90 dias
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={timeRange === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  {customDateRange ? 'Período personalizado' : 'Selecionar período'}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end">
                <DateRangePicker onDateRangeChange={handleDateRangeChange} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {analytics?.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalOrders || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {analytics?.averageOrderValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos por Dia</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.totalOrders && timeRange ? (
                  (analytics.totalOrders / parseInt(timeRange)).toFixed(1)
                ) : '0'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Vendas por Dia</CardTitle>
              <CardDescription>Receita e número de pedidos ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.salesTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'Receita (R$)') {
                        return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                      }
                      return value;
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Receita (R$)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    name="Pedidos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance por Categoria</CardTitle>
              <CardDescription>Receita gerada por cada categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.categoryPerformance || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status dos Pedidos</CardTitle>
            <CardDescription>Status atual dos pedidos no período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics?.orderStatus || []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="hsl(var(--primary))"
                  label
                >
                  {analytics?.orderStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Analytics;