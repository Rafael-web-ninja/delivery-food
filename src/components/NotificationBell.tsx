import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/formatters';

export const NotificationBell = () => {
  const { notifications, markAsRead, clearAll, hasUnread } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {hasUnread && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 text-xs rounded-full flex items-center justify-center min-w-[20px] p-0 border-2 border-background bg-red-600 hover:bg-red-600 text-white"
            >
              {notifications.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notificações
          {hasUnread && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAll}
              className="text-xs h-auto p-1"
            >
              Limpar todas
            </Button>
          )}
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <ScrollArea className="max-h-64">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-3 cursor-pointer"
                onClick={() => {
                  markAsRead(notification.id);
                  window.location.href = `/dashboard/orders?orderId=${notification.id}`;
                }}
              >
                <div className="font-medium text-sm">
                  Novo pedido - {notification.customer_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(Number(notification.total_amount))} • {' '}
                  {new Date(notification.created_at).toLocaleTimeString('pt-BR')}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};