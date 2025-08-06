import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, MessageCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  cart: CartItem[];
  business: Business;
  total: number;
  customerData: {
    name: string;
    phone: string;
    address: string;
    notes?: string;
  };
}

export default function OrderSuccessModal({ 
  isOpen, 
  onClose, 
  orderId, 
  cart, 
  business, 
  total, 
  customerData 
}: OrderSuccessModalProps) {
  const [deliveryFee, setDeliveryFee] = useState(0);

  useEffect(() => {
    const fetchDeliveryFee = async () => {
      const { data } = await supabase
        .from('delivery_businesses')
        .select('delivery_fee')
        .eq('id', business.id)
        .single();
      
      if (data) {
        setDeliveryFee(Number(data.delivery_fee || 0));
      }
    };

    if (isOpen && business.id) {
      fetchDeliveryFee();
    }
  }, [isOpen, business.id]);

  const generateWhatsAppMessage = () => {
    const totalWithDelivery = total + deliveryFee;
    
    let message = `*Pedido #${orderId.slice(-8)} - ${business.name}*\n\n`;
    
    message += `*Cliente:* ${customerData.name}\n`;
    message += `*Telefone:* ${customerData.phone}\n`;
    message += `*Endereço:* ${customerData.address}\n\n`;
    
    message += `*Itens:*\n`;
    cart.forEach(item => {
      message += `• ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
    });
    
    message += `\n*Subtotal: R$ ${total.toFixed(2)}*\n`;
    
    if (deliveryFee > 0) {
      message += `*Taxa de entrega: R$ ${deliveryFee.toFixed(2)}*\n`;
    }
    
    message += `*Total: R$ ${totalWithDelivery.toFixed(2)}*\n`;
    
    if (customerData.notes) {
      message += `\n*Observações:* ${customerData.notes}\n`;
    }
    
    message += `\nPor favor, confirme meu pedido!`;
    
    return encodeURIComponent(message);
  };

  const handleWhatsAppNotification = () => {
    const phone = business.phone?.replace(/\D/g, '') || '';
    const message = generateWhatsAppMessage();
    const whatsappUrl = `https://wa.me/55${phone}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
  };

  if (!isOpen) return null;

  const totalWithDelivery = total + deliveryFee;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <CardTitle className="text-green-700">Pedido Confirmado!</CardTitle>
              <CardDescription>
                Pedido #{orderId.slice(-8)} realizado com sucesso
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Detalhes do pedido */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm">Detalhes do Pedido</h3>
            <p className="text-sm"><strong>Estabelecimento:</strong> {business.name}</p>
            <p className="text-sm"><strong>Cliente:</strong> {customerData.name}</p>
            <p className="text-sm"><strong>Endereço:</strong> {customerData.address}</p>
          </div>

          {/* Resumo dos itens */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Itens do Pedido</h4>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Taxa de entrega</span>
                  <span>R$ {deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>R$ {totalWithDelivery.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="space-y-2">
            <Button 
              onClick={handleWhatsAppNotification}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Notificar pelo WhatsApp
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full"
            >
              Fechar
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Você pode acompanhar o status do seu pedido no histórico
          </div>
        </CardContent>
      </Card>
    </div>
  );
}