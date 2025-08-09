import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Settings, 
  BarChart3, 
  Menu, 
  X,
  Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: 'Painel', href: '/dashboard', icon: Home },
  { name: 'Cardápio', href: '/menu', icon: Package },
  { name: 'Pedidos', href: '/orders', icon: ShoppingCart },
  { name: 'Relatórios', href: '/analytics', icon: BarChart3 },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 bg-card border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">DeliveryFácil</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Button
                key={item.name}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-primary text-primary-foreground"
                )}
                onClick={() => {
                  navigate(item.href);
                  onToggle(); // Fechar sidebar em mobile após navegação
                }}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Button>
            );
          })}
        </nav>
      </div>
    </>
  );
}