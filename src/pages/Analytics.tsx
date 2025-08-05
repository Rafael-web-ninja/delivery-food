import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthWithRole } from "@/hooks/useAuthWithRole";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users,
  Download,
  Clock,
  Star,
  Calendar,
  Filter
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const Analytics = () => {
  const { toast } = useToast();
  const { user } = useAuthWithRole();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [realData, setRealData] = useState({
    orders: [],
    totalRevenue: 0,
    totalOrders: 0,
    averageTicket: 0,
    activeCustomers: 0
  });

  // Fetch dados reais
  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Buscar business do usuário
      const { data: business } = await supabase
        .from('delivery_businesses')
        .select('id')
        .eq('owner_id', user?.id)
        .single();

      if (!business) {
        toast({
          title: "Erro",
          description: "Negócio não encontrado",
          variant: "destructive"
        });
        return;
      }

      // Calcular datas baseado no período selecionado
      let startDate = new Date();
      let endDate = new Date();

      switch (selectedPeriod) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        case "custom":
          if (customStartDate && customEndDate) {
            startDate = new Date(customStartDate);
            endDate = new Date(customEndDate);
          }
          break;
      }

      // Buscar pedidos do período
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('business_id', business.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao buscar pedidos:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados dos relatórios",
          variant: "destructive"
        });
        return;
      }

      // Processar dados
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const totalOrders = orders?.length || 0;
      const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Clientes únicos
      const uniqueCustomers = new Set(orders?.map(order => order.customer_phone || order.customer_name)).size;

      setRealData({
        orders: orders || [],
        totalRevenue,
        totalOrders,
        averageTicket,
        activeCustomers: uniqueCustomers
      });

    } catch (error) {
      console.error('Erro ao buscar analytics:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar relatórios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, selectedPeriod, customStartDate, customEndDate]);

  // Processar dados para gráficos
  const processChartData = () => {
    if (!realData.orders.length) return [];
    
    const ordersGrouped = realData.orders.reduce((acc, order) => {
      const date = new Date(order.created_at).toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
      
      if (!acc[date]) {
        acc[date] = { date, orders: 0, revenue: 0 };
      }
      
      acc[date].orders += 1;
      acc[date].revenue += Number(order.total_amount);
      
      return acc;
    }, {});

    return Object.values(ordersGrouped);
  };

  const chartData = processChartData();

  // Mock data para top produtos (implementar busca real depois)
  const topProducts = [
    { name: "Produto mais vendido 1", sales: realData.totalOrders > 0 ? Math.floor(realData.totalOrders * 0.4) : 0, revenue: realData.totalRevenue * 0.3 },
    { name: "Produto mais vendido 2", sales: realData.totalOrders > 0 ? Math.floor(realData.totalOrders * 0.3) : 0, revenue: realData.totalRevenue * 0.25 },
    { name: "Produto mais vendido 3", sales: realData.totalOrders > 0 ? Math.floor(realData.totalOrders * 0.2) : 0, revenue: realData.totalRevenue * 0.2 },
  ];

  const customerData = [
    { name: "Novos", value: 65, color: "#FF8C00" },
    { name: "Recorrentes", value: 35, color: "#32CD32" },
  ];

  const handleExport = (format: string) => {
    toast({
      title: "Exportação",
      description: `Funcionalidade de exportação em ${format} será implementada em breve`,
    });
  };

  return (
    <div className="space-y-8">
      {/* Header melhorado com filtros */}
      <div className="bg-white rounded-xl shadow-soft border border-orange-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              Relatórios e Analytics
            </h1>
            <p className="text-muted-foreground mt-2">
              Análise detalhada de vendas e performance do seu delivery
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Último Mês</SelectItem>
                  <SelectItem value="year">Último Ano</SelectItem>
                  <SelectItem value="custom">Período Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedPeriod === "custom" && (
              <div className="flex gap-2">
                <div>
                  <Label htmlFor="start-date" className="sr-only">Data inicial</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="sr-only">Data final</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-40"
                  />
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport('pdf')} size="sm">
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={() => handleExport('excel')} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards - Dados reais */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <Card className="gradient-primary text-white border-none shadow-medium hover:shadow-strong transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium opacity-90">
              Receita Total
            </CardTitle>
            <DollarSign className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              R$ {realData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-sm opacity-80 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Período selecionado
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-medium hover:shadow-strong transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium opacity-90">
              Total de Pedidos
            </CardTitle>
            <ShoppingCart className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{realData.totalOrders.toLocaleString('pt-BR')}</div>
            <p className="text-sm opacity-80 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Período selecionado
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none shadow-medium hover:shadow-strong transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium opacity-90">
              Ticket Médio
            </CardTitle>
            <BarChart3 className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">
              R$ {realData.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-sm opacity-80 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Média do período
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-none shadow-medium hover:shadow-strong transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium opacity-90">
              Clientes Únicos
            </CardTitle>
            <Users className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{realData.activeCustomers.toLocaleString('pt-BR')}</div>
            <p className="text-sm opacity-80 flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Período selecionado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="shadow-soft border-orange-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <BarChart3 className="h-5 w-5 text-primary" />
              Receita por Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value, name) => [
                      name === 'revenue' ? `R$ ${Number(value).toFixed(2)}` : value,
                      name === 'revenue' ? 'Receita' : 'Pedidos'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#FF8C00" 
                    strokeWidth={3}
                    dot={{ fill: '#FF8C00', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum dado encontrado para o período selecionado</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders by Day */}
        <Card className="shadow-soft border-orange-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <Clock className="h-5 w-5 text-primary" />
              Pedidos por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="orders" fill="#32CD32" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum pedido encontrado para o período selecionado</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
        {/* Top Products */}
        <Card className="xl:col-span-2 shadow-soft border-orange-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <Star className="h-5 w-5 text-primary" />
              Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gradient-secondary rounded-lg border border-orange-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.sales} vendas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-lg">R$ {product.revenue.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">receita</p>
                  </div>
                </div>
              ))}
              {realData.totalOrders === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum produto vendido ainda</p>
                  <p className="text-sm">Os produtos aparecerão aqui após as primeiras vendas</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Insights */}
        <Card className="shadow-soft border-orange-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <Users className="h-5 w-5 text-primary" />
              Tipos de Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={customerData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {customerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-3 mt-4">
              {customerData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;