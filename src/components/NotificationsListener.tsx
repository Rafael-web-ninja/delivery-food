
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

// Componente invisível que garante que as notificações sejam inicializadas para usuários autenticados
const NotificationsListener = () => {
  const { user, initialized } = useAuth();
  
  // Sempre usa o hook de notificações para qualquer usuário autenticado
  // O hook internamente gerencia notificações tanto para donos quanto para clientes
  useNotifications();
  
  console.log('👂 NotificationsListener ativo - user:', user?.id || 'nenhum', 'initialized:', initialized);
  
  return null;
};

export default NotificationsListener;
