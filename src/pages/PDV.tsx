import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/formatters";
import { useCoupon } from '@/hooks/useCoupon';
import { useScheduling } from '@/hooks/useScheduling';
import { Plus, Minus, Search, X } from "lucide-react";
import FractionalPizzaDialog from "@/components/FractionalPizzaDialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  preparation_time?: number;
  category_id?: string | null;
  supports_fractional?: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
  menu_item_id?: string; // para pizzas meio a meio
  details?: any;
}

interface PaymentMethod { id: string; type: string; name: string }

export default function PDV() {
  const { toast } = useToast();
  const [businessId, setBusinessId] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("Meu Delivery");
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  const [items, setItems] = useState<MenuItem[]>([]);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<string>("cash");

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    notes: ""
  });

  const [fractionalOpen, setFractionalOpen] = useState(false);
  const [fractionalBaseItem, setFractionalBaseItem] = useState<MenuItem | null>(null);
  const [fractionalQuantity, setFractionalQuantity] = useState<number>(1);
  const [isPickup, setIsPickup] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const { appliedCoupon, loading: couponLoading, validateAndApplyCoupon, removeCoupon } = useCoupon();
  const { allowScheduling, getMinScheduleDateTime, formatScheduleDateTime } = useScheduling(businessId);
  const [scheduledAt, setScheduledAt] = useState('');

  // Buscar business do dono logado
  useEffect(() => {
    const loadBusiness = async () => {
      try {
        const { data: id } = await supabase.rpc("get_user_business_id");
        if (!id) {
          toast({ title: "Nenhum delivery", description: "Cadastre seu delivery nas configurações.", variant: "destructive" });
          return;
        }
        setBusinessId(id as unknown as string);
        const { data: biz } = await supabase
          .from("delivery_businesses")
          .select("name, delivery_fee")
          .eq("id", id)
          .single();
        if (biz) {
          setBusinessName(biz.name);
          setDeliveryFee(Number(biz.delivery_fee || 0));
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadBusiness();
  }, [toast]);

  // Carregar cardápio e métodos de pagamento
  useEffect(() => {
    if (!businessId) return;
    const load = async () => {
      const [{ data: menu }, { data: pm }] = await Promise.all([
        supabase.from("menu_items").select("*").eq("business_id", businessId).eq("active", true).order("name"),
        supabase.from("payment_methods").select("id,type,name").eq("business_id", businessId).eq("is_active", true).order("name")
      ]);
      setItems((menu || []) as any);
      setPaymentMethods((pm || []) as any);
      if (pm && pm.length > 0) setSelectedPayment(pm[0].type);
    };
    load();
  }, [businessId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => i.name.toLowerCase().includes(q) || (i.description || "").toLowerCase().includes(q));
  }, [items, query]);

  const addItem = (item: MenuItem) => {
    if (item.supports_fractional) {
      setFractionalBaseItem(item);
      setFractionalQuantity(1);
      setFractionalOpen(true);
      return;
    }
    setCart(prev => {
      const existing = prev.find(ci => ci.id === item.id);
      if (existing) return prev.map(ci => ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const onConfirmFractional = (fi: { id: string; menu_item_id: string; name: string; price: number; quantity: number; details?: any }) => {
    const base = items.find(i => i.id === fi.menu_item_id);
    const newItem: CartItem = {
      id: fi.id,
      name: fi.name,
      description: base?.description || "",
      price: fi.price,
      image_url: base?.image_url,
      preparation_time: base?.preparation_time,
      category_id: base?.category_id || null,
      supports_fractional: true,
      quantity: fi.quantity,
      menu_item_id: fi.menu_item_id,
      details: fi.details
    };
    setCart(prev => {
      const existing = prev.find(ci => ci.id === newItem.id);
      if (existing) return prev.map(ci => ci.id === newItem.id ? { ...ci, quantity: ci.quantity + newItem.quantity } : ci);
      return [...prev, newItem];
    });
  };

  const inc = (id: string) => setCart(prev => prev.map(ci => ci.id === id ? { ...ci, quantity: ci.quantity + 1 } : ci));
  const dec = (id: string) => setCart(prev => prev.flatMap(ci => ci.id === id ? (ci.quantity > 1 ? [{ ...ci, quantity: ci.quantity - 1 }] : []) : [ci]));
  const remove = (id: string) => setCart(prev => prev.filter(ci => ci.id !== id));

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const appliedDeliveryFee = useMemo(() => (isPickup ? 0 : Number(deliveryFee || 0)), [isPickup, deliveryFee]);
  const total = subtotal + appliedDeliveryFee;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    await validateAndApplyCoupon(couponCode, businessId, subtotal, null);
  };

  const finalize = async () => {
    if (!businessId) return;
    if (!customer.name || !customer.phone) {
      toast({ title: "Dados do cliente", description: "Informe nome e telefone.", variant: "destructive" });
      return;
    }
    if (cart.length === 0) {
      toast({ title: "Carrinho vazio", description: "Adicione itens ao pedido.", variant: "destructive" });
      return;
    }

    try {
      const order_code = crypto.randomUUID().slice(0, 8);
      const finalNotes = [customer.notes || "", isPickup ? "Retirada no balcão" : ""].filter(Boolean).join(" — ");
      const finalTotal = total - (appliedCoupon?.discount_amount || 0);
      
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          order_code,
          business_id: businessId,
          delivery_id: businessId,
          user_id: (await supabase.auth.getUser()).data.user?.id || null,
          customer_id: null,
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_address: customer.address || "",
          total_amount: finalTotal,
          delivery_fee: appliedDeliveryFee,
          discount_amount: appliedCoupon?.discount_amount || 0,
          coupon_code: appliedCoupon?.code || null,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          payment_method: selectedPayment as any,
          notes: finalNotes,
          status: "pending"
        })
        .select()
        .single();

      if (error) throw error;

      const orderItems = cart.map(item => {
        const isFractional = !!item.menu_item_id && item.details;
        const details = item.details as any;
        const notes = isFractional && details?.flavor1?.name && details?.flavor2?.name
          ? `Meio a meio — ${details.size === 'grande' ? 'Grande' : 'Broto'} — 1/2 ${details.flavor1.name} + 1/2 ${details.flavor2.name}`
          : null;
        return {
          order_id: order.id,
          menu_item_id: item.menu_item_id ?? item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          ...(notes ? { notes } : {})
        };
      });

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      // Criar redemption do cupom se aplicado
      if (appliedCoupon) {
        const { error: redemptionError } = await supabase
          .from('coupon_redemptions')
          .insert({
            coupon_id: appliedCoupon.id,
            order_id: order.id,
            customer_id: null, // PDV não tem customer_id
            discount_amount: appliedCoupon.discount_amount
          });

        if (redemptionError) {
          console.error('Coupon redemption error:', redemptionError);
          // Não falhar o pedido por causa do cupom, apenas logar o erro
        }
      }

      toast({ title: "Pedido criado!", description: `#${order.order_code}` });
      setCart([]);
      setCustomer({ name: "", phone: "", address: "", notes: "" });
      setCouponCode('');
      removeCoupon();
      setScheduledAt('');
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro ao criar pedido", description: e.message || "Tente novamente", variant: "destructive" });
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">PDV</h1>
        <p className="text-muted-foreground">Lance pedidos no balcão para {businessName}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lista de itens */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar itens..." className="pl-8" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(item => (
              <Card key={item.id} className="hover:shadow-sm transition-shadow">
                <CardHeader className="p-3">
                  <CardTitle className="text-base leading-tight">{item.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 flex items-center justify-between">
                  <div className="text-sm font-medium">{formatCurrency(Number(item.price))}</div>
                  <div className="flex items-center gap-2">
                    {item.supports_fractional && (
                      <Badge variant="secondary">Meio a meio</Badge>
                    )}
                    <Button size="sm" onClick={() => addItem(item)}>Adicionar</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Carrinho */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {cart.length === 0 && (
                  <div className="text-sm text-muted-foreground">Nenhum item</div>
                )}
                {cart.map(ci => (
                  <div key={ci.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{ci.name}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(ci.price)} x {ci.quantity}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => dec(ci.id)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => inc(ci.id)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Tipo de pedido</div>
                  <div className="text-xs text-muted-foreground">{isPickup ? 'Retirada no balcão' : 'Entrega'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isPickup ? 'text-muted-foreground' : ''}`}>Entrega</span>
                  <Switch checked={isPickup} onCheckedChange={setIsPickup} aria-label="Alternar para retirada" />
                  <span className={`text-xs ${isPickup ? '' : 'text-muted-foreground'}`}>Retirada</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Taxa de entrega</span>
                  <span>{formatCurrency(appliedDeliveryFee)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center justify-between text-sm text-green-600">
                    <span>Desconto ({appliedCoupon.code})</span>
                    <span>-{formatCurrency(appliedCoupon.discount_amount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(total - (appliedCoupon?.discount_amount || 0))}</span>
                </div>
              </div>

              <Separator />

              {/* Seção de cupom */}
              <div className="space-y-2">
                <h4 className="font-medium">Cupom de Desconto</h4>
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Código do cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                    >
                      {couponLoading ? 'Verificando...' : 'Aplicar'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-medium">{appliedCoupon.code}</span>
                      <span className="text-green-600">-{formatCurrency(appliedCoupon.discount_amount)}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={removeCoupon}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  <Input placeholder="Nome do cliente" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} />
                  <Input placeholder="Telefone" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} />
                  <Input placeholder="Endereço (opcional)" value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} />
                  <Input placeholder="Observações (opcional)" value={customer.notes} onChange={e => setCustomer({ ...customer, notes: e.target.value })} />
                </div>

                {/* Agendamento de pedidos */}
                {allowScheduling && (
                  <div className="grid grid-cols-1 gap-2">
                    <Label>Agendar pedido (opcional)</Label>
                    <Input
                      type="datetime-local"
                      value={scheduledAt}
                      min={getMinScheduleDateTime()}
                      onChange={(e) => setScheduledAt(e.target.value)}
                    />
                    {scheduledAt && (
                      <p className="text-xs text-muted-foreground">
                        Agendado para: {formatScheduleDateTime(scheduledAt)}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.length > 0 ? paymentMethods.map(pm => (
                    <Button key={pm.id} variant={selectedPayment === pm.type ? "default" : "outline"} onClick={() => setSelectedPayment(pm.type)}>
                      {pm.name}
                    </Button>
                  )) : (
                    <Button disabled variant="outline">Sem pagamentos ativos</Button>
                  )}
                </div>
              </div>

              <Button className="w-full" onClick={finalize} disabled={cart.length === 0}>Finalizar pedido</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de meio a meio */}
      <FractionalPizzaDialog
        open={fractionalOpen}
        onOpenChange={setFractionalOpen}
        businessId={businessId}
        baseItem={fractionalBaseItem ? { id: fractionalBaseItem.id, name: fractionalBaseItem.name } : null}
        menuItemId={fractionalBaseItem?.id}
        quantity={fractionalQuantity}
        onConfirm={onConfirmFractional}
      />
    </div>
  );
}
