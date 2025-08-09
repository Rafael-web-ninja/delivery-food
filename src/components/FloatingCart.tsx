import { ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface FloatingCartProps {
  count: number;
  total: number;
  onClick: () => void;
  bgColor?: string; // hex fallback to business theme
  textColor?: string; // hex fallback to business theme
}

export default function FloatingCart({ count, total, onClick, bgColor = '#16A34A', textColor = '#FFFFFF' }: FloatingCartProps) {
  return (
    <button
      type="button"
      aria-label={`Abrir carrinho com ${count} itens`}
      onClick={onClick}
      className="fixed bottom-4 right-4 z-50 shadow-lg rounded-full px-4 py-3 flex items-center gap-3 hover-scale animate-fade-in focus:outline-none focus:ring-2 focus:ring-primary/40"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <div className="relative">
        <ShoppingCart className="h-5 w-5" />
        <span className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1 rounded-full text-xs flex items-center justify-center" style={{ backgroundColor: '#ef4444', color: '#fff' }}>
          {count}
        </span>
      </div>
      <div className="flex flex-col items-start leading-tight">
        <span className="text-xs opacity-90">Ver carrinho</span>
        <span className="text-sm font-semibold">{formatCurrency(total)}</span>
      </div>
    </button>
  );
}
