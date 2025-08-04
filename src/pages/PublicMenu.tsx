import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Plus, Minus, Phone, MapPin, Clock, User, LogIn } from 'lucide-react';
import CheckoutForm from '@/components/CheckoutForm';
import BusinessStatus from '@/components/BusinessStatus';
import CustomerProfile from '@/components/CustomerProfile';
import CustomerOrders from '@/components/CustomerOrders';
import { useAuth } from '@/hooks/useAuth';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  preparation_time: number;
}

interface Business {
  id: string;
  name: string;
  description: string;
  phone: string;
  address: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

const PublicMenu = () => {
  const { businessId } = useParams();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    if (businessId) {
      fetchBusinessAndMenu();
    }
  }, [businessId]);

  const fetchBusinessAndMenu = async () => {
    try {
      const [businessResult, itemsResult] = await Promise.all([
        supabase
          .from('delivery_businesses')
          .select('*')
          .eq('id', businessId)
          .single(),
        supabase
          .from('menu_items')
          .select('*')
          .eq('business_id', businessId)
          .eq('active', true)
          .order('name')
      ]);

      if (businessResult.data) setBusiness(businessResult.data);
      if (itemsResult.data) setItems(itemsResult.data);
      
    } catch (error) {
      console.error('Erro ao carregar cardápio:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o cardápio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      if (existing) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });

    toast({
      title: "Item adicionado!",
      description: `${item.name} foi adicionado ao carrinho`,
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(cartItem =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
      return prev.filter(cartItem => cartItem.id !== itemId);
    });
  };
  
  const updateCartItem = (itemId: string, change: number) => {
    const existingItem = items.find(item => item.id === itemId);
    if (!existingItem) return;
    
    if (change > 0) {
      addToCart(existingItem);
    } else {
      removeFromCart(itemId);
    }
  };
  
  const getCartItemQuantity = (itemId: string) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const generateWhatsAppMessage = () => {
    if (cart.length === 0) return '';
    
    let message = `*Pedido - ${business?.name}*\n\n`;
    
    cart.forEach(item => {
      message += `• ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
    });
    
    message += `\n*Total: R$ ${getCartTotal().toFixed(2)}*\n\n`;
    message += `Por favor, confirme meu pedido!`;
    
    return encodeURIComponent(message);
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao carrinho antes de fazer o pedido",
        variant: "destructive"
      });
      return;
    }
    setShowCheckout(true);
  };

  const handleOrderComplete = () => {
    setCart([]);
    setShowCheckout(false);
    toast({
      title: "Pedido realizado!",
      description: "Obrigado pelo seu pedido!",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Delivery não encontrado</h1>
          <p className="text-muted-foreground">O link pode estar incorreto ou o delivery pode estar indisponível.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{business?.name}</h1>
              {business?.description && (
                <p className="text-gray-600 mt-1">{business.description}</p>
              )}
              
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                {business?.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    <span>{business.phone}</span>
                  </div>
                )}
                {business?.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{business.address}</span>
                  </div>
                )}
                {business && <BusinessStatus businessId={business.id} />}
              </div>
            </div>
            
            {/* Carrinho e Login */}
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Olá, {user.email}</span>
                  <Button variant="outline" onClick={signOut} size="sm">
                    Sair
                  </Button>
                </div>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Entrar</span>
                  </Button>
                </Link>
              )}
              
              <Button 
                onClick={() => setShowCheckout(true)}
                className="relative flex items-center gap-2"
                disabled={cart.length === 0}
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Carrinho</span>
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="container mx-auto px-4 py-8">
        {user ? (
          <Tabs defaultValue="menu" className="space-y-6">
            <TabsList>
              <TabsTrigger value="menu">Cardápio</TabsTrigger>
              <TabsTrigger value="profile">Meu Perfil</TabsTrigger>
              <TabsTrigger value="orders">Meus Pedidos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="menu">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400">Sem imagem</div>
                      )}
                    </div>
                    
                    <CardHeader>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      {item.description && (
                        <CardDescription>{item.description}</CardDescription>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">
                          R$ {Number(item.price).toFixed(2)}
                        </span>
                        {item.preparation_time > 0 && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.preparation_time}min
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartItem(item.id, -1)}
                            disabled={getCartItemQuantity(item.id) === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold">
                            {getCartItemQuantity(item.id)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartItem(item.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Button 
                          onClick={() => addToCart(item)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Adicionar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="profile">
              <CustomerProfile />
            </TabsContent>
            
            <TabsContent value="orders">
              <CustomerOrders />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400">Sem imagem</div>
                  )}
                </div>
                
                <CardHeader>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  {item.description && (
                    <CardDescription>{item.description}</CardDescription>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      R$ {Number(item.price).toFixed(2)}
                    </span>
                    {item.preparation_time > 0 && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.preparation_time}min
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartItem(item.id, -1)}
                        disabled={getCartItemQuantity(item.id) === 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">
                        {getCartItemQuantity(item.id)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartItem(item.id, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button 
                      onClick={() => addToCart(item)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutForm
          cart={cart}
          business={business!}
          total={getCartTotal()}
          onOrderComplete={handleOrderComplete}
          onCancel={() => setShowCheckout(false)}
        />
      )}
    </div>
  );
};

export default PublicMenu;