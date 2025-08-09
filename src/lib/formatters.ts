// Currency formatting utilities
export function formatCurrency(value: number): string {
  return `R$${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Status translations
export const statusTranslations = {
  pending: 'Pendente',
  preparing: 'Em Preparação', 
  out_for_delivery: 'Saiu para Entrega',
  ready: 'Pronto para Entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
} as const;

// Payment method translations
export const paymentTranslations = {
  cash: 'Dinheiro',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'PIX',
  food_voucher: 'Vale Alimentação',
  // Suporte a valores antigos
  card: 'Cartão'
} as const;