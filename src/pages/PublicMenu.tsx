import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
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
import { formatCurrency } from '@/lib/formatters';
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
import FloatingCart from '@/components/FloatingCart';
import FractionalPizzaDialog from '@/components/FractionalPizzaDialog';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  preparation_time: number;
  category_id: string | null;
  supports_fractional?: boolean;
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
  delivery_time_minutes: number;
  min_order_value: number;
}

interface CartItem extends MenuItem {
  quantity: number;
  menu_item_id?: string;
  details?: any;
}

const PublicMenu = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const [searchParams] = useSearchParams();
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
const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'menu');
  const [fractionalOpen, setFractionalOpen] = useState(false);
  const [fractionalBaseItem, setFractionalBaseItem] = useState<MenuItem | null>(null);
  const [fractionalQuantity, setFractionalQuantity] = useState(1);

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
      if (!hex || hex === '#ffffff' || hex === '#000000') return null;
      
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

    // Aplicar cores se elas não forem as padrões
    const primaryHsl = hexToHsl(business.primary_color);
    const secondaryHsl = hexToHsl(business.secondary_color);
    const accentHsl = hexToHsl(business.accent_color);
    const backgroundHsl = hexToHsl(business.background_color);
    const foregroundHsl = hexToHsl(business.text_color);

    if (primaryHsl) {
      root.style.setProperty('--primary', primaryHsl);
    }
    if (secondaryHsl) {
      root.style.setProperty('--secondary', secondaryHsl);
    }
    if (accentHsl) {
      root.style.setProperty('--accent', accentHsl);
    }
    if (backgroundHsl) {
      root.style.setProperty('--background', backgroundHsl);
    }
    if (foregroundHsl) {
      root.style.setProperty('--foreground', foregroundHsl);
    }

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
      let biz: any = null;

      // Tenta por ID primeiro
      const byId = await supabase
        .from('delivery_businesses')
        .select('*')
        .eq('id', businessId)
        .eq('is_active', true)
        .maybeSingle();

      if (byId.data) {
        biz = byId.data;
      } else {
        // Fallback: tenta por slug
        const bySlug = await supabase
          .from('delivery_businesses')
          .select('*')
          .eq('slug', businessId!)
          .eq('is_active', true)
          .maybeSingle();
        if (bySlug.data) biz = bySlug.data;
      }

      if (biz) {
        // Verificar assinatura ativa via Edge Function pública (bypass RLS)
        const { data: subscriptionData, error: subError } = await supabase.functions.invoke(
          'get-business-subscription',
          {
            body: { ownerId: biz.owner_id },
          }
        );

        if (subError) {
          console.error('Error checking subscription:', subError);
          setBusiness(null);
          setLoading(false);
          return;
        }

        if (!subscriptionData?.active) {
          setBusiness(null);
          setLoading(false);
          return;
        }

        // Assinatura ativa - continuar
        setBusiness(biz);
        const itemsResult = await supabase
          .from('menu_items')
          .select('*')
          .eq('business_id', biz.id)
          .eq('active', true)
          .order('name');
        if (itemsResult.data) {
          setAllItems(itemsResult.data);
          setItems(itemsResult.data);
        }
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

  // Estados para controle de quantidade antes de adicionar
  const [selectedQuantities, setSelectedQuantities] = useState<{ [key: string]: number }>({});

  // Gerenciamento de seleção de quantidade
  const updateSelectedQuantity = (itemId: string, change: number) => {
    setSelectedQuantities(prev => {
      const current = prev[itemId] || 0;
      const newQuantity = Math.max(0, current + change);
      return { ...prev, [itemId]: newQuantity };
    });
  };

// Adicionar ao carrinho com quantidade selecionada
  const addToCart = (item: MenuItem) => {
    const quantity = selectedQuantities[item.id] || 1;
    setCart(prev => {
      const existing = prev.find(ci => ci.id === item.id);
      if (existing) {
        return prev.map(ci =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + quantity } : ci
        );
      }
      return [...prev, { ...item, quantity } as CartItem];
    });
    
    // Reset quantidade selecionada
    setSelectedQuantities(prev => ({ ...prev, [item.id]: 0 }));
    
    toast({
      title: 'Item adicionado!',
      description: `${quantity}x ${item.name} adicionado ao carrinho`
    });
  };

  const openFractional = (item: MenuItem) => {
    const qty = selectedQuantities[item.id] || 1;
    setFractionalQuantity(qty);
    setFractionalBaseItem(item);
    setFractionalOpen(true);
  };

  const handleConfirmFractional = (fi: { id: string; menu_item_id: string; name: string; price: number; quantity: number; details?: any }) => {
    const base = allItems.find(i => i.id === fi.menu_item_id);
    const newItem: CartItem = {
      id: fi.id,
      name: fi.name,
      description: base?.description || '',
      price: fi.price,
      image_url: base?.image_url || '',
      preparation_time: base?.preparation_time || 0,
      category_id: base?.category_id || null,
      supports_fractional: true,
      quantity: fi.quantity,
      menu_item_id: fi.menu_item_id,
      details: fi.details
    };
    setCart(prev => {
      const existing = prev.find(ci => ci.id === newItem.id);
      if (existing) {
        return prev.map(ci => ci.id === newItem.id ? { ...ci, quantity: ci.quantity + newItem.quantity } : ci);
      }
      return [...prev, newItem];
    });
    setSelectedQuantities(prev => ({ ...prev, [fi.menu_item_id]: 0 }));
    toast({ title: 'Pizza adicionada!', description: `${fi.quantity}x ${fi.name} adicionada ao carrinho` });
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

  const getCartItemQuantity = (itemId: string) =>
    cart.find(ci => ci.id === itemId)?.quantity || 0;

const getCartTotal = () =>
  cart.reduce((sum, ci) => sum + ci.price * ci.quantity, 0);

  const generateWhatsAppMessage = () => {
    if (!business || cart.length === 0) return '';
    let message = `*Pedido - ${business?.name || 'Estabelecimento'}*\n\n`;
    cart.forEach(ci => {
      message += `• ${ci.quantity}x ${ci.name} - R$ ${(
        ci.price * ci.quantity
      )} \n`;
    });
    message += `\n*Total: ${formatCurrency(getCartTotal())}*\n\n`;
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
        <div className="text-center space-y-4 p-8">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-foreground">Cardápio Indisponível</h1>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-yellow-800">
              <p className="text-lg font-medium mb-2">
                O cardápio desta empresa está temporariamente desativado.
              </p>
              <p className="text-sm">
                Este estabelecimento pode estar com a assinatura pendente ou inativa. 
                Entre em contato diretamente com o estabelecimento para mais informações.
              </p>
            </div>
          </div>
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
                    alt={`${business?.name || 'Estabelecimento'} logo`}
                    className="h-20 lg:h-24 w-auto max-w-[200px] object-contain rounded-lg"
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  {business?.name || 'Estabelecimento'}
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
                  <Button variant="outline" onClick={signOut} size="sm" className="hover:bg-primary hover:text-primary-foreground">
                    Sair
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground">
                    <User className="h-4 w-4" />
                    Entrar
                  </Button>
                </Link>
              )}
<Button
  variant="secondary"
  onClick={() => setShowCheckout(true)}
  className="relative flex items-center gap-2 border-0"
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="menu">Cardápio</TabsTrigger>
              <TabsTrigger value="profile">Meu Perfil</TabsTrigger>
              <TabsTrigger value="orders">Meus Pedidos</TabsTrigger>
            </TabsList>

            <TabsContent value="menu">
              <MenuFilters 
                businessId={business!.id} 
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
  {item.supports_fractional ? `A partir de ${formatCurrency(item.price)}` : formatCurrency(item.price)}
</span>
{business.delivery_time_minutes > 0 && (
  <Badge
    variant="secondary"
    className="flex items-center gap-1"
    style={{
      backgroundColor: business.delivery_time_bg_color || '#000000',
      color: business.delivery_time_text_color || '#FFFFFF'
    }}
  >
    <Clock className="h-3 w-3" />
    {business.delivery_time_minutes}min
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
                            onClick={() => updateSelectedQuantity(item.id, -1)}
                            disabled={(selectedQuantities[item.id] || 0) === 0}
                            className="hover:bg-primary hover:text-primary-foreground"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold">
                            {selectedQuantities[item.id] || 0}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateSelectedQuantity(item.id, 1)}
                            className="hover:bg-primary hover:text-primary-foreground"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>

<div className="flex items-center gap-2">
                          {item.supports_fractional && (
                            <Button
                              variant="outline"
                              onClick={() => openFractional(item)}
                              disabled={(selectedQuantities[item.id] || 0) === 0}
                            >
                              Meio a meio
                            </Button>
                          )}
{!item.supports_fractional && (
  <Button
    variant="secondary"
    onClick={() => addToCart(item)}
    className="flex items-center gap-2 border-0"
    disabled={(selectedQuantities[item.id] || 0) === 0}
    style={{
      backgroundColor: business.button_color || '#16A34A',
      color: business.button_text_color || '#FFFFFF'
    }}
  >
    <Plus className="h-4 w-4" />
    Adicionar
  </Button>
)}
                        </div>
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
              businessId={business!.id} 
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
  {item.supports_fractional ? `A partir de ${formatCurrency(item.price)}` : formatCurrency(item.price)}
</span>
 {business.delivery_time_minutes > 0 && (
   <Badge
     variant="secondary"
     className="flex items-center gap-1"
     style={{
       backgroundColor: business.delivery_time_bg_color || '#000000',
       color: business.delivery_time_text_color || '#FFFFFF'
     }}
   >
     <Clock className="h-3 w-3" />
     {business.delivery_time_minutes}min
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
                         onClick={() => updateSelectedQuantity(item.id, -1)}
                         disabled={(selectedQuantities[item.id] || 0) === 0}
                         className="hover:bg-primary hover:text-primary-foreground"
                       >
                         <Minus className="h-4 w-4" />
                       </Button>
                       <span className="w-8 text-center font-semibold">
                         {selectedQuantities[item.id] || 0}
                       </span>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => updateSelectedQuantity(item.id, 1)}
                         className="hover:bg-primary hover:text-primary-foreground"
                       >
                         <Plus className="h-4 w-4" />
                       </Button>
                     </div>

<div className="flex items-center gap-2">
                         {item.supports_fractional && (
                           <Button
                             variant="outline"
                             onClick={() => openFractional(item)}
                             disabled={(selectedQuantities[item.id] || 0) === 0}
                           >
                             Meio a meio
                           </Button>
                         )}
{!item.supports_fractional && (
  <Button
    variant="secondary"
    onClick={() => addToCart(item)}
    className="flex items-center gap-2 border-0"
    disabled={(selectedQuantities[item.id] || 0) === 0}
    style={{
      backgroundColor: business.button_color || '#16A34A',
      color: business.button_text_color || '#FFFFFF'
    }}
  >
    <Plus className="h-4 w-4" />
    Adicionar
  </Button>
)}
                      </div>
                  </div>
                </CardContent>
              </Card>
             ))}
           </div>
           </>
        )}
      </div>

      {cart.length > 0 && !showCheckout && (
        <FloatingCart
          count={cart.reduce((sum, ci) => sum + ci.quantity, 0)}
          total={getCartTotal()}
          onClick={() => setShowCheckout(true)}
          bgColor={business.cart_button_color || '#16A34A'}
          textColor={business.cart_button_text_color || '#FFFFFF'}
        />
      )}

      <FractionalPizzaDialog
        open={fractionalOpen}
        onOpenChange={setFractionalOpen}
        businessId={business.id}
        baseItem={fractionalBaseItem ? { id: fractionalBaseItem.id, name: fractionalBaseItem.name } : null}
        menuItemId={fractionalBaseItem?.id}
        quantity={fractionalQuantity}
        onConfirm={handleConfirmFractional}
      />

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutForm
          cart={cart}
          business={business!}
          total={getCartTotal()}
          onOrderComplete={handleOrderComplete}
          onCancel={() => setShowCheckout(false)}
          onRemoveItem={removeFromCart}
        />
      )}
    </div>
  );
};

export default PublicMenu;