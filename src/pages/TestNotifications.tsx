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
          <h1 className="text-3xl font-bold">Teste de Notificações</h1>
          <div className="flex items-center gap-4">
            {currentUser && (
              <Badge variant="outline">
                {currentUser === 'delivery_owner' ? '👨‍💼 Dono' : '👤 Cliente'}
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
            <CardTitle>Como Testar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Para Donos de Delivery:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Faça login como dono</li>
                <li>Clique em "Criar Pedido de Teste"</li>
                <li>Você deve ver: toast de "Novo Pedido!" + sininho vermelho com contagem</li>
                <li>Clique no sininho para ver a notificação</li>
              </ol>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Para Clientes:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Faça login como cliente</li>
                <li>Clique em "Atualizar Status do Pedido"</li>
                <li>Você deve ver: toast de "Em preparação" + sininho vermelho</li>
                <li>Clique no sininho para ver a notificação</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestNotifications;