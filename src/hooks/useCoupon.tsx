import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_order_value: number;
  business_id: string;
}

interface AppliedCoupon extends Coupon {
  discount_amount: number;
}

export const useCoupon = () => {
  const { toast } = useToast();
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [loading, setLoading] = useState(false);

  const validateAndApplyCoupon = async (
    couponCode: string, 
    businessId: string, 
    subtotal: number,
    customerId?: string
  ): Promise<AppliedCoupon | null> => {
    if (!couponCode.trim()) {
      toast({
        title: "Erro",
        description: "Digite o código do cupom",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      // Buscar cupom ativo e válido
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('business_id', businessId)
        .eq('code', couponCode.toUpperCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      if (couponError) throw couponError;

      if (!coupon) {
        toast({
          title: "Cupom inválido",
          description: "Cupom não encontrado ou inativo",
          variant: "destructive"
        });
        return null;
      }

      // Validar data de início
      if (coupon.start_at && new Date(coupon.start_at) > new Date()) {
        toast({
          title: "Cupom inválido",
          description: "Este cupom ainda não está válido",
          variant: "destructive"
        });
        return null;
      }

      // Validar data de fim
      if (coupon.end_at && new Date(coupon.end_at) < new Date()) {
        toast({
          title: "Cupom expirado",
          description: "Este cupom já expirou",
          variant: "destructive"
        });
        return null;
      }

      // Validar limite total de usos
      if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
        toast({
          title: "Cupom esgotado",
          description: "Este cupom atingiu o limite de uso",
          variant: "destructive"
        });
        return null;
      }

      // Validar pedido mínimo
      if (subtotal < coupon.min_order_value) {
        toast({
          title: "Pedido insuficiente",
          description: `Pedido mínimo de R$ ${coupon.min_order_value.toFixed(2)} para usar este cupom`,
          variant: "destructive"
        });
        return null;
      }

      // Validar limite por cliente (se fornecido)
      if (coupon.max_uses_per_customer && customerId) {
        const { data: customerUses, error: usesError } = await supabase
          .from('coupon_redemptions')
          .select('id')
          .eq('coupon_id', coupon.id)
          .eq('customer_id', customerId);

        if (usesError) throw usesError;

        if (customerUses && customerUses.length >= coupon.max_uses_per_customer) {
          toast({
            title: "Limite atingido",
            description: "Você já utilizou este cupom o máximo de vezes permitido",
            variant: "destructive"
          });
          return null;
        }
      }

      // Calcular desconto
      let discountAmount = 0;
      if (coupon.type === 'percent') {
        discountAmount = (subtotal * coupon.value) / 100;
      } else {
        discountAmount = coupon.value;
      }

      // Garantir que o desconto não seja maior que o subtotal
      discountAmount = Math.min(discountAmount, subtotal);

      const appliedCouponData: AppliedCoupon = {
        ...coupon,
        discount_amount: discountAmount
      };

      setAppliedCoupon(appliedCouponData);
      
      toast({
        title: "Cupom aplicado!",
        description: `Desconto de R$ ${discountAmount.toFixed(2)} aplicado`,
      });

      return appliedCouponData;

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao validar cupom",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast({
      title: "Cupom removido",
      description: "O cupom foi removido do pedido",
    });
  };

  return {
    appliedCoupon,
    loading,
    validateAndApplyCoupon,
    removeCoupon
  };
};