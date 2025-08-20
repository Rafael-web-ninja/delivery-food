import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { NotificationBell } from '@/components/NotificationBell';
import NotificationsListener from '@/components/NotificationsListener';
import { Badge } from '@/components/ui/badge';

const TestNotifications = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const loginAsOwner = async () => {
    setTesting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'delivery4@teste.com',
        password: 'teste123'
      });
      
      if (error) {
        toast({
          title: "Erro",
          description: "Falha ao fazer login como dono: " + error.message,
          variant: "destructive"
        });
      } else {
        setCurrentUser('delivery_owner');
        toast({
          title: "✅ Login realizado",
          description: "Logado como dono do delivery",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const loginAsCustomer = async () => {
    setTesting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'maria@teste.com',
        password: 'teste123'
      });
      
      if (error) {
        toast({
          title: "Erro",
          description: "Falha ao fazer login como cliente: " + error.message,
          variant: "destructive"
        });
      } else {
        setCurrentUser('customer');
        toast({
          title: "✅ Login realizado",
          description: "Logado como cliente",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    toast({
      title: "✅ Logout realizado",
      description: "Deslogado com sucesso",
    });
  };

  const createTestOrder = async () => {
    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Faça login primeiro",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    try {
      // Criar um novo pedido para testar notificações
      const { error } = await supabase
        .from('orders')
        .insert({
          business_id: '46703aca-d928-4890-87d1-1f8c38af0da2',
          customer_id: '1be2d54d-6a8c-48bf-aa26-fa949b8577cd',
          customer_name: 'Maria Silva (Teste)',
          customer_phone: '(11) 99999-9999',
          customer_address: 'Rua Teste, 123',
          total_amount: 50.00,
          delivery_fee: 5.00,
          payment_method: 'pix',
          status: 'pending',
          notes: 'Pedido de teste para notificações'
        });

      if (error) {
        toast({
          title: "Erro",
          description: "Falha ao criar pedido: " + error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "✅ Pedido criado",
          description: "Pedido de teste criado com sucesso! Verifique as notificações.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const updateOrderStatus = async () => {
    if (!currentUser) {
      toast({
        title: "Erro",
        description: "Faça login primeiro",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    try {
      // Buscar o último pedido pendente
      const { data: orders, error: fetchError } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'pending')
        .eq('business_id', '46703aca-d928-4890-87d1-1f8c38af0da2')
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError || !orders || orders.length === 0) {
        toast({
          title: "Erro",
          description: "Nenhum pedido pendente encontrado. Crie um pedido primeiro.",
          variant: "destructive"
        });
        return;
      }

      // Atualizar status para "preparing"
      const { error } = await supabase
        .from('orders')
        .update({ status: 'preparing' })
        .eq('id', orders[0].id);

      if (error) {
        toast({
          title: "Erro",
          description: "Falha ao atualizar pedido: " + error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "✅ Status atualizado",
          description: "Status do pedido atualizado para 'Em preparação'! Verifique as notificações.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <NotificationsListener />
      
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sistema de Notificações - TESTE DEFINITIVO</h1>
            <p className="text-muted-foreground mt-2">Senhas resetadas! Logs detalhados no console (F12)</p>
          </div>
          <div className="flex items-center gap-4">
            {currentUser && (
              <Badge variant="outline" className="text-lg px-3 py-1">
                {currentUser === 'delivery_owner' ? '👨‍💼 Dono Logado' : '👤 Cliente Logado'}
              </Badge>
            )}
            <NotificationBell />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Login de Teste</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={loginAsOwner} 
                disabled={testing || currentUser === 'delivery_owner'}
                className="w-full"
              >
                {testing ? 'Fazendo login...' : 'Login como Dono (delivery4@teste.com)'}
              </Button>
              
              <Button 
                onClick={loginAsCustomer} 
                disabled={testing || currentUser === 'customer'}
                className="w-full"
                variant="outline"
              >
                {testing ? 'Fazendo login...' : 'Login como Cliente (maria@teste.com)'}
              </Button>

              {currentUser && (
                <Button 
                  onClick={logout} 
                  variant="destructive"
                  className="w-full"
                >
                  Logout
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Testar Notificações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={createTestOrder} 
                disabled={testing || !currentUser}
                className="w-full"
              >
                {testing ? 'Criando pedido...' : 'Criar Pedido de Teste'}
              </Button>
              
              <Button 
                onClick={updateOrderStatus} 
                disabled={testing || !currentUser}
                className="w-full"
                variant="outline"
              >
                {testing ? 'Atualizando...' : 'Atualizar Status do Pedido'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>🔔 Como Testar as Notificações - DEFINITIVO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">✅ Credenciais CORRETAS (senhas resetadas):</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Dono:</strong> delivery4@teste.com | <strong>Senha:</strong> teste123</div>
                <div><strong>Cliente:</strong> maria@teste.com | <strong>Senha:</strong> teste123</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">📋 Passos para Testar:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li><strong>Abra o Console do Browser (F12)</strong> - logs detalhados estão ativos!</li>
                  <li><strong>Faça login como dono</strong> - deve ver logs de "Business notifications are ACTIVE!"</li>
                  <li><strong>Crie um pedido de teste</strong> - deve aparecer toast + sininho vermelho</li>
                  <li><strong>Logout e login como cliente</strong> - deve ver logs de "Customer notifications are ACTIVE!"</li>
                  <li><strong>Atualize status do pedido</strong> - deve aparecer toast de mudança de status</li>
                </ol>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">🔍 Logs para Verificar no Console:</h4>
                <div className="text-xs font-mono space-y-1">
                  <div>✅ "Setting up notifications for user: [ID]"</div>
                  <div>✅ "Business notifications are ACTIVE!" (donos)</div>
                  <div>✅ "Customer notifications are ACTIVE!" (clientes)</div>
                  <div>✅ "NEW ORDER received for business:" (ao criar pedido)</div>
                  <div>✅ "ORDER STATUS UPDATE received for customer:" (ao mudar status)</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestNotifications;