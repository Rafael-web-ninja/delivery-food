import { useBusinessStatus } from '@/hooks/useBusinessStatus';

interface BusinessStatusProps {
  businessId: string;
  acceptOrdersWhenClosed?: boolean;
}

export default function BusinessStatus({ businessId, acceptOrdersWhenClosed = false }: BusinessStatusProps) {
  const { isOpen, loading } = useBusinessStatus(businessId, acceptOrdersWhenClosed);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse"></div>
        <span className="text-sm text-gray-500">Verificando...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div 
        className={`w-3 h-3 rounded-full ${
          isOpen ? 'bg-green-500' : 'bg-red-500'
        }`}
      ></div>
      <span className={`text-sm font-medium ${
        isOpen ? 'text-green-600' : 'text-red-600'
      }`}>
        {isOpen ? 'Aberto' : 'Fechado'}
      </span>
    </div>
  );
}