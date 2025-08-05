import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuthWithRole } from '@/hooks/useAuthWithRole';
import { supabase } from '@/integrations/supabase/client';
import { User, MapPin, Phone, Mail, X } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Business {
  id: string;
  name: string;
  phone: string;
}

interface CheckoutFormProps {
  cart: CartItem[];
  business: Business;
  total: number;
  onOrderComplete: () => void;
  onCancel: () => void;
  onRemoveItem?: (itemId: string) => void;
}

export default function CheckoutForm({ cart, business, total, onOrderComplete, onCancel, onRemoveItem }: CheckoutFormProps) {
  const { toast } = useToast();
  const { user, signIn, signUp } = useAuthWithRole();
  const [loading, setLoading] = useState(false);
  
  // Formulário de dados do cliente
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });

  // Formulário de login/cadastro
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const handleAuthChange = (field: string, value: string) => {
    setAuthData(prev => ({ ...prev, [field]: value }));
  };

  // Carregar dados do perfil do usuário logado
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user?.id) {
        try {
          const { data: profile } = await supabase
            .from('customer_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (profile) {
            setCustomerData(prev => ({
              ...prev,
              name: profile.name || '',
              phone: profile.phone || '',
              address: profile.address || '',
              email: user.email || ''
            }));
          } else {
            // Se não tem perfil, usar apenas o email do usuário
            setCustomerData(prev => ({
              ...prev,
              email: user.email || ''
            }));
          }
        } catch (error) {
          console.log('Erro ao carregar perfil:', error);
          // Em caso de erro, apenas usar o email
          setCustomerData(prev => ({
            ...prev,
            email: user.email || ''
          }));
        }
      }
    };

    loadUserProfile();
  }, [user]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await signIn(authData.email, authData.password);
      if (error) throw error;
      
      toast({
        title: "Login realizado!",
        description: "Agora você pode finalizar seu pedido",
      });
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (authData.password !== authData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(authData.email, authData.password);
      if (error) throw error;

      // Criar perfil do cliente
      await supabase
        .from('customer_profiles')
        .insert({
          user_id: user?.id,
          name: authData.name,
          phone: customerData.phone,
          address: customerData.address
        });

      toast({
        title: "Cadastro realizado!",
        description: "Login automático realizado. Você já pode finalizar seu pedido!",
      });
      
      // Preencher automaticamente os dados do cliente
      setCustomerData(prev => ({
        ...prev,
        email: authData.email,
        name: authData.name
      }));
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateWhatsAppMessage = async () => {
    // Buscar a taxa de entrega
    const { data: businessData } = await supabase
      .from('delivery_businesses')
      .select('delivery_fee')
      .eq('id', business.id)
      .single();
    
    const deliveryFee = businessData?.delivery_fee || 0;
    const totalWithDelivery = total + Number(deliveryFee);
    
    let message = `*Pedido - ${business.name}*\n\n`;
    
    message += `*Cliente:* ${customerData.name}\n`;
    message += `*Telefone:* ${customerData.phone}\n`;
    message += `*Endereço:* ${customerData.address}\n\n`;
    
    message += `*Itens:*\n`;
    cart.forEach(item => {
      message += `• ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
    });
    
    message += `\n*Subtotal: R$ ${total.toFixed(2)}*\n`;
    
    if (deliveryFee > 0) {
      message += `*Taxa de entrega: R$ ${Number(deliveryFee).toFixed(2)}*\n`;
    }
    
    message += `*Total: R$ ${totalWithDelivery.toFixed(2)}*\n`;
    
    if (customerData.notes) {
      message += `\n*Observações:* ${customerData.notes}\n`;
    }
    
    message += `\nPor favor, confirme meu pedido!`;
    
    return encodeURIComponent(message);
  };

  const saveOrderToDatabase = async () => {
    try {
      // Buscar a taxa de entrega do negócio
      const { data: businessData } = await supabase
        .from('delivery_businesses')
        .select('delivery_fee')
        .eq('id', business.id)
        .single();
      
      const deliveryFee = businessData?.delivery_fee || 0;
      const totalWithDelivery = total + Number(deliveryFee);

      // Criar o pedido
      const orderData = {
        business_id: business.id,
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        customer_address: customerData.address || '',
        total_amount: totalWithDelivery,
        delivery_fee: deliveryFee,
        payment_method: 'cash' as const,
        notes: customerData.notes || '',
        status: 'pending' as const,
        user_id: user?.id || null
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Order error:', orderError);
        throw new Error('Erro ao criar pedido. Verifique os dados e tente novamente.');
      }

      // Criar os itens do pedido
      const orderItems = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Items error:', itemsError);
        throw new Error('Erro ao adicionar itens do pedido.');
      }

      return order;
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      throw error;
    }
  };

  const handleFinishOrder = async () => {
    if (!customerData.name || !customerData.phone || !customerData.address) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Salvar pedido no banco
      await saveOrderToDatabase();

      // Enviar para WhatsApp
      const phone = business.phone?.replace(/\D/g, '') || '';
      const message = await generateWhatsAppMessage();
      const whatsappUrl = `https://wa.me/55${phone}?text=${message}`;
      
      window.open(whatsappUrl, '_blank');
      
      toast({
        title: "Pedido enviado!",
        description: "Seu pedido foi registrado e enviado via WhatsApp",
      });
      
      onOrderComplete();
    } catch (error: any) {
      console.error('Erro ao finalizar pedido:', error);
      toast({
        title: "Erro ao finalizar pedido",
        description: error.message || "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Finalizar Pedido</CardTitle>
            <CardDescription>
              Preencha seus dados para confirmar o pedido
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resumo do pedido */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Resumo do Pedido</h3>
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm py-1">
                  <span>{item.quantity}x {item.name}</span>
                  <div className="flex items-center gap-2">
                    <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem?.(item.id)}
                      className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="border-t mt-2 pt-2 font-semibold flex justify-between">
                <span>Total</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Login/Cadastro ou dados do cliente */}
            {!user ? (
              <Tabs defaultValue="guest">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="guest">Continuar sem conta</TabsTrigger>
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="signup">Cadastrar</TabsTrigger>
                </TabsList>
                
                <TabsContent value="guest" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nome completo *
                      </Label>
                      <Input
                        id="name"
                        value={customerData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="seu@email.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefone *
                      </Label>
                      <Input
                        id="phone"
                        value={customerData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="address" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Endereço de entrega *
                      </Label>
                      <Input
                        id="address"
                        value={customerData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        placeholder="Rua, número, bairro, cidade"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        value={customerData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        placeholder="Observações sobre o pedido (opcional)"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="login" className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={authData.email}
                      onChange={(e) => handleAuthChange('email', e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={authData.password}
                      onChange={(e) => handleAuthChange('password', e.target.value)}
                      placeholder="Sua senha"
                    />
                  </div>
                  <Button onClick={handleLogin} disabled={loading} className="w-full">
                    Entrar
                  </Button>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name">Nome</Label>
                    <Input
                      id="signup-name"
                      value={authData.name}
                      onChange={(e) => handleAuthChange('name', e.target.value)}
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={authData.email}
                      onChange={(e) => handleAuthChange('email', e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={authData.password}
                      onChange={(e) => handleAuthChange('password', e.target.value)}
                      placeholder="Escolha uma senha"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-confirm">Confirmar senha</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      value={authData.confirmPassword}
                      onChange={(e) => handleAuthChange('confirmPassword', e.target.value)}
                      placeholder="Confirme sua senha"
                    />
                  </div>
                  <Button onClick={handleSignUp} disabled={loading} className="w-full">
                    Cadastrar
                  </Button>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-4">
                <p className="text-green-600">✓ Logado como {user.email}</p>
                {/* Dados do cliente para usuários logados */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Nome completo *
                    </Label>
                    <Input
                      id="name"
                      value={customerData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefone *
                    </Label>
                    <Input
                      id="phone"
                      value={customerData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereço de entrega *
                    </Label>
                    <Input
                      id="address"
                      value={customerData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Rua, número, bairro, cidade"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      value={customerData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Observações sobre o pedido (opcional)"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={handleFinishOrder} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Processando...' : 'Finalizar Pedido'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}