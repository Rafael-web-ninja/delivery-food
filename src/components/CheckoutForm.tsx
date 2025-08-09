import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, paymentTranslations } from '@/lib/formatters';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { User, MapPin, Phone, Mail, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OrderSuccessModal from './OrderSuccessModal';
import { DeliveryFeeDisplay, TotalWithDelivery } from './DeliveryFeeDisplay';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
const [loading, setLoading] = useState(false);
const [showSuccessModal, setShowSuccessModal] = useState(false);
const [completedOrderId, setCompletedOrderId] = useState('');
const [minOrderValue, setMinOrderValue] = useState(0);
  
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

// Métodos de pagamento
type PaymentOption = 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'card'; // 'card' legado
const [paymentMethods, setPaymentMethods] = useState<Array<{ id: string; type: PaymentOption; name: string }>>([]);
const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentOption>('cash');
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

// Carregar valor mínimo do pedido
useEffect(() => {
  const loadMinOrder = async () => {
    try {
      const { data } = await supabase
        .from('delivery_businesses')
        .select('min_order_value')
        .eq('id', business.id)
        .single();
      setMinOrderValue(Number(data?.min_order_value || 0));
    } catch (e) {
      setMinOrderValue(0);
    }
  };
  if (business?.id) loadMinOrder();
}, [business?.id]);

// Carrega métodos de pagamento ativos do delivery
useEffect(() => {
  const loadPaymentMethods = async () => {
    try {
      const { data } = await supabase
        .from('payment_methods')
        .select('id,type,name')
        .eq('business_id', business.id)
        .eq('is_active', true)
        .order('name');
      if (data && data.length > 0) {
        setPaymentMethods(data as any);
        setSelectedPaymentMethod((data[0].type as PaymentOption) ?? 'cash');
      } else {
        setPaymentMethods([]);
        setSelectedPaymentMethod('cash');
      }
    } catch (e) {
      setPaymentMethods([]);
    }
  };
  if (business?.id) loadPaymentMethods();
}, [business?.id]);

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

      toast({
        title: "Cadastro realizado!",
        description: "Você já pode finalizar seu pedido!",
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
      message += `• ${item.quantity}x ${item.name} - ${formatCurrency(item.price * item.quantity)}\n`;
    });
    
    message += `\n*Subtotal: ${formatCurrency(total)}*\n`;

    if (deliveryFee > 0) {
      message += `*Taxa de entrega: ${formatCurrency(Number(deliveryFee))}*\n`;
    }

    message += `*Total: ${formatCurrency(totalWithDelivery)}*\n`;
    
    if (customerData.notes) {
      message += `\n*Observações:* ${customerData.notes}\n`;
    }
    
    message += `\nPor favor, confirme meu pedido!`;
    
    return encodeURIComponent(message);
  };

  const saveOrderToDatabase = async () => {
    try {
      if (!user) {
        throw new Error('Você precisa estar logado para fazer um pedido');
      }

      console.log('💾 Salvando pedido para usuário:', user.id, user.email);

      // 1. Buscar ou criar customer_id do customer_profiles usando auth.uid()
      let { data: customerProfile, error: customerError } = await supabase
        .from('customer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (customerError) {
        console.error('❌ Erro ao buscar customer profile:', customerError);
        throw customerError;
      }

      if (!customerProfile) {
        console.log('📝 Customer profile não existe, criando automaticamente...');
        
        // Criar perfil automaticamente
        const { data: newProfile, error: createError } = await supabase
          .from('customer_profiles')
          .insert({
            user_id: user.id,
            name: customerData.name || user.email?.split('@')[0] || 'Cliente',
            phone: customerData.phone || '',
            address: customerData.address || ''
          })
          .select('id')
          .single();

        if (createError) {
          console.error('❌ Erro ao criar customer profile:', createError);
          throw new Error('Erro ao criar perfil de cliente. Tente novamente.');
        }

        customerProfile = newProfile;
        console.log('✅ Customer profile criado:', customerProfile);
      } else {
        console.log('👤 Customer profile encontrado:', customerProfile);
      }

      // Buscar a taxa de entrega do negócio
      const { data: businessData } = await supabase
        .from('delivery_businesses')
        .select('delivery_fee')
        .eq('id', business.id)
        .single();
      
      const deliveryFee = businessData?.delivery_fee || 0;
      const totalWithDelivery = total + Number(deliveryFee);

      // 2. Validar IDs obrigatórios
      if (!customerProfile.id || !business.id || !user.id) {
        throw new Error('Erro: Não foi possível vincular o pedido ao seu perfil. Faça login novamente.');
      }

      // 3. Criar pedido com customer_id, delivery_id e user_id
      const generatedOrderCode = crypto.randomUUID().slice(0, 8);
      
      const orderData = {
        order_code: generatedOrderCode,
        customer_id: customerProfile.id,
        business_id: business.id,
        delivery_id: business.id, // delivery_id = business_id
        user_id: user.id, // Adicionar user_id para compatibilidade
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        customer_address: customerData.address || '',
        total_amount: totalWithDelivery,
        delivery_fee: deliveryFee,
        payment_method: selectedPaymentMethod as any,
        notes: customerData.notes || '',
        status: 'pending' as const
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

      // 3. Criar os itens do pedido
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

  if (total < minOrderValue) {
    toast({
      title: "Pedido mínimo não atingido",
      description: `Faltam ${formatCurrency(minOrderValue - total)} para atingir o pedido mínimo`,
      variant: "destructive"
    });
    return;
  }

  setLoading(true);
  try {
      // Salvar pedido no banco
      const order = await saveOrderToDatabase();
      
      toast({
        title: "Pedido confirmado!",
        description: "Seu pedido foi registrado com sucesso",
      });
      
      // Mostrar modal de sucesso
      setCompletedOrderId(order.id);
      setShowSuccessModal(true);
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
                    <span>{formatCurrency(item.price * item.quantity)}</span>
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
              <div className="border-t mt-2 pt-2">
                <div className="flex justify-between text-sm py-1">
                  <span>Subtotal</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <DeliveryFeeDisplay businessId={business.id} />
                <div className="border-t mt-2 pt-2 font-semibold flex justify-between">
                  <span>Total</span>
                  <TotalWithDelivery businessId={business.id} subtotal={total} />
                </div>
</div>

{minOrderValue > total && (
  <div className="mt-3 p-3 rounded bg-yellow-50 text-yellow-800 border border-yellow-200 text-sm">
    Pedido mínimo de {formatCurrency(minOrderValue)}. Faltam {formatCurrency(minOrderValue - total)} para finalizar.
  </div>
)}

              <div className="mt-4">
                <h3 className="font-semibold mb-2">Forma de Pagamento</h3>
                {paymentMethods.length > 0 ? (
                  <RadioGroup
                    value={selectedPaymentMethod}
                    onValueChange={(v) => setSelectedPaymentMethod(v as PaymentOption)}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                  >
                    {paymentMethods.map((m) => (
                      <label key={m.id} htmlFor={`pm-${m.id}`} className="flex items-center gap-3 p-3 border rounded-md cursor-pointer">
                        <RadioGroupItem id={`pm-${m.id}`} value={m.type} />
                        <span>{paymentTranslations[m.type as keyof typeof paymentTranslations] ?? m.name}</span>
                      </label>
                    ))}
                  </RadioGroup>
                ) : (
                  <p className="text-sm text-muted-foreground">Dinheiro</p>
                )}
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
  disabled={loading || total < minOrderValue}
  className="flex-1"
>
  {loading ? 'Processando...' : 'Finalizar Pedido'}
</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de sucesso */}
      <OrderSuccessModal 
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        orderId={completedOrderId}
        cart={cart}
        business={business}
        total={total}
        customerData={customerData}
      />
    </div>
  );
}