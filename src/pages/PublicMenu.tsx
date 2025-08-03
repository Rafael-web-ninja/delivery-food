import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Minus, Clock, Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CheckoutForm from '@/components/CheckoutForm';

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
  const [business, setBusiness] = useState<Business | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Store className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">{business.name}</h1>
              {business.description && (
                <p className="text-primary-foreground/80">{business.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Menu Items */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold mb-6">Cardápio</h2>
            
            {items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum item disponível no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                          {item.description && (
                            <CardDescription className="mt-1">
                              {item.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-32 object-cover rounded-md mb-3"
                        />
                      )}
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-2xl font-bold text-primary">
                          R$ {item.price.toFixed(2)}
                        </span>
                        
                        {item.preparation_time > 0 && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.preparation_time}min
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {cart.find(cartItem => cartItem.id === item.id) ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="font-medium px-2">
                                {cart.find(cartItem => cartItem.id === item.id)?.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addToCart(item)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => addToCart(item)}
                              className="flex-1"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Carrinho ({getCartItemCount()})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cart.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Carrinho vazio
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity}x R$ {item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium px-1">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addToCart(item)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between items-center font-bold">
                          <span>Total:</span>
                          <span>R$ {getCartTotal().toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full mt-4" 
                        onClick={handleProceedToCheckout}
                      >
                        Finalizar Pedido
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
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