import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  ShoppingCart,
  Plus,
  Minus,
  Phone,
  MapPin,
  Clock,
  User
} from 'lucide-react';
import CheckoutForm from '@/components/CheckoutForm';
import BusinessStatus from '@/components/BusinessStatus';
import CustomerProfile from '@/components/CustomerProfile';
import CustomerOrders from '@/components/CustomerOrders';
import { MenuFilters } from '@/components/MenuFilters';
import { useAuth } from '@/hooks/useAuth';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  preparation_time: number;
  category_id: string | null;
}

interface Business {
  id: string;
  name: string;
  description: string;
  phone: string;
  address: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  button_color: string;
  button_text_color: string;
  cart_button_color: string;
  cart_button_text_color: string;
  delivery_time_bg_color: string;
  delivery_time_text_color: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

const PublicMenu = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [filters, setFilters] = useState({ search: '', categoryId: null as string | null });

  // 1️⃣ Carregar dados ao montar / businessId mudar
  useEffect(() => {
    if (businessId) {
      fetchBusinessAndMenu();
      loadCartFromStorage();
    }
  }, [businessId]);

  // 1.1️⃣ Carregar carrinho do localStorage
  const loadCartFromStorage = () => {
    const storageKey = `cart_${businessId}`;
    const savedCart = localStorage.getItem(storageKey);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
      }
    }
  };

  // Carregar carrinho mesmo após login - mantém itens
  useEffect(() => {
    // Este useEffect preserva o carrinho quando o usuário faz login
    // Não limpa o carrinho, apenas mantém o que já estava
  }, [user]);

  // 1.2️⃣ Salvar carrinho no localStorage
  useEffect(() => {
    if (businessId && cart.length > 0) {
      const storageKey = `cart_${businessId}`;
      localStorage.setItem(storageKey, JSON.stringify(cart));
    }
  }, [cart, businessId]);

  // 2️⃣ Aplicar cores personalizadas SEMPRE antes dos retornos
  useEffect(() => {
    if (!business) return;
    const root = document.documentElement;
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0,
        s = 0,
        l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }
        h /= 6;
      }
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(
        l * 100
      )}%`;
    };
    root.style.setProperty(
      '--primary',
      hexToHsl(business.primary_color || '#2563eb')
    );
    root.style.setProperty(
      '--secondary',
      hexToHsl(business.secondary_color || '#64748b')
    );
    root.style.setProperty(
      '--accent',
      hexToHsl(business.accent_color || '#059669')
    );
    root.style.setProperty(
      '--background',
      hexToHsl(business.background_color || '#ffffff')
    );
    root.style.setProperty(
      '--foreground',
      hexToHsl(business.text_color || '#1e293b')
    );
    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--secondary');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--background');
      root.style.removeProperty('--foreground');
    };
  }, [business]);

  // Função de fetch
  const fetchBusinessAndMenu = async () => {
    try {
      const [businessResult, itemsResult] = await Promise.all([
        supabase
          .from('delivery_businesses')
          .select('*')
          .eq('id', businessId)
          .eq('is_active', true)
          .maybeSingle(),
        supabase
          .from('menu_items')
          .select('*')
          .eq('business_id', businessId)
          .eq('active', true)
          .order('name')
      ]);

      if (businessResult.data) setBusiness(businessResult.data);
      if (itemsResult.data) {
        setAllItems(itemsResult.data);
        setItems(itemsResult.data);
      }
    } catch (error) {
      console.error('Erro ao carregar cardápio:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o cardápio',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Gerenciamento de carrinho
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.id === item.id);
      if (existing) {
        return prev.map(ci =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast({
      title: 'Item adicionado!',
      description: `${item.name} foi adicionado ao carrinho`
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(ci =>
          ci.id === itemId ? { ...ci, quantity: ci.quantity - 1 } : ci
        );
      }
      return prev.filter(ci => ci.id !== itemId);
    });
  };

  const updateCartItem = (itemId: string, change: number) => {
    const existing = items.find(i => i.id === itemId);
    if (!existing) return;
    change > 0 ? addToCart(existing) : removeFromCart(itemId);
  };

  const getCartItemQuantity = (itemId: string) =>
    cart.find(ci => ci.id === itemId)?.quantity || 0;

  const getCartTotal = () =>
    cart.reduce((sum, ci) => sum + ci.price * ci.quantity, 0);

  const generateWhatsAppMessage = () => {
    if (!business || cart.length === 0) return '';
    let message = `*Pedido - ${business.name}*\n\n`;
    cart.forEach(ci => {
      message += `• ${ci.quantity}x ${ci.name} - R$ ${(
        ci.price * ci.quantity
      ).toFixed(2)}\n`;
    });
    message += `\n*Total: R$ ${getCartTotal().toFixed(2)}*\n\n`;
    message += `Por favor, confirme meu pedido!`;
    return encodeURIComponent(message);
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: 'Carrinho vazio',
        description: 'Adicione itens ao carrinho antes de fazer o pedido',
        variant: 'destructive'
      });
      return;
    }
    setShowCheckout(true);
  };

  const handleOrderComplete = () => {
    // Limpar carrinho do storage também
    const storageKey = `cart_${businessId}`;
    localStorage.removeItem(storageKey);
    
    setCart([]);
    setShowCheckout(false);
    toast({
      title: 'Pedido realizado!',
      description: 'Obrigado pelo seu pedido!'
    });
  };

  // Filtrar itens baseado nos filtros
  useEffect(() => {
    let filtered = [...allItems];
    
    // Filtro por categoria
    if (filters.categoryId) {
      filtered = filtered.filter(item => item.category_id === filters.categoryId);
    }
    
    // Filtro por pesquisa
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        (item.description && item.description.toLowerCase().includes(searchTerm))
      );
    }
    
    setItems(filtered);
  }, [filters, allItems]);

  // ——————— RETORNOS ANTECIPADOS ———————
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-xl text-muted-foreground">Carregando cardápio...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Delivery não encontrado</h1>
          <p className="text-muted-foreground">
            O link pode estar incorreto ou o delivery pode estar indisponível.
          </p>
        </div>
      </div>
    );
  }

  // ——————— JSX PRINCIPAL ———————
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 flex-1">
              {business.logo_url && (
                <div className="flex-shrink-0">
                  <img
                    src={business.logo_url}
                    alt={`${business.name} logo`}
                    className="h-20 lg:h-24 w-auto max-w-[200px] object-contain rounded-lg"
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  {business.name}
                </h1>
                {business.description && (
                  <p className="text-muted-foreground text-base lg:text-lg mb-4 max-w-2xl">
                    {business.description}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 text-sm text-muted-foreground">
                  {business.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{business.phone}</span>
                    </div>
                  )}
                  {business.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="text-center lg:text-left">{business.address}</span>
                    </div>
                  )}
                  <BusinessStatus businessId={business.id} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground hidden lg:block">
                    Olá, {user.email}
                  </span>
                  <Button variant="outline" onClick={signOut} size="sm">
                    Sair
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Entrar
                  </Button>
                </Link>
              )}
              <Button
                onClick={() => setShowCheckout(true)}
                className="relative flex items-center gap-2"
                disabled={cart.length === 0}
                style={{
                  backgroundColor: business.cart_button_color || '#16A34A',
                  color: business.cart_button_text_color || '#FFFFFF'
                }}
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Carrinho</span>
                {cart.length > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0 min-w-[20px]"
                  >
                    {cart.reduce((sum, ci) => sum + ci.quantity, 0)}
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
              <MenuFilters 
                businessId={businessId!} 
                onFilterChange={setFilters} 
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(item => (
                  <Card
                    key={item.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
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
                          R$ {item.price.toFixed(2)}
                        </span>
                        {item.preparation_time > 0 && (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1"
                            style={{
                              backgroundColor: business.delivery_time_bg_color || '#000000',
                              color: business.delivery_time_text_color || '#FFFFFF'
                            }}
                          >
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
                          style={{
                            backgroundColor: business.button_color || '#16A34A',
                            color: business.button_text_color || '#FFFFFF'
                          }}
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
          <>
            <MenuFilters 
              businessId={businessId!} 
              onFilterChange={setFilters} 
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
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
                      R$ {item.price.toFixed(2)}
                    </span>
                     {item.preparation_time > 0 && (
                       <Badge
                         variant="secondary"
                         className="flex items-center gap-1"
                         style={{
                           backgroundColor: business.delivery_time_bg_color || '#000000',
                           color: business.delivery_time_text_color || '#FFFFFF'
                         }}
                       >
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
                       style={{
                         backgroundColor: business.button_color || '#16A34A',
                         color: business.button_text_color || '#FFFFFF'
                       }}
                     >
                       <Plus className="h-4 w-4" />
                       Adicionar
                     </Button>
                  </div>
                </CardContent>
              </Card>
             ))}
           </div>
           </>
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