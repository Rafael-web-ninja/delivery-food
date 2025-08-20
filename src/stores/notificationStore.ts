
interface OrderNotification {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_code?: string;
}

interface NotificationStore {
  notifications: OrderNotification[];
  listeners: Set<() => void>;
}

class NotificationStoreManager {
  private store: NotificationStore = {
    notifications: [],
    listeners: new Set(),
  };

  subscribe(callback: () => void) {
    this.store.listeners.add(callback);
    return () => this.store.listeners.delete(callback);
  }

  getNotifications(): OrderNotification[] {
    return [...this.store.notifications];
  }

  addNotification(notification: OrderNotification) {
    console.log('📝 Adding notification to store:', notification);
    this.store.notifications = [notification, ...this.store.notifications.slice(0, 9)];
    this.notifyListeners();
  }

  updateNotification(notification: OrderNotification) {
    console.log('🔄 Updating notification in store:', notification);
    this.store.notifications = this.store.notifications.map(n =>
      n.id === notification.id ? notification : n
    );
    this.notifyListeners();
  }

  removeNotification(id: string) {
    console.log('🗑️ Removing notification from store:', id);
    this.store.notifications = this.store.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  clearAll() {
    console.log('🧹 Clearing all notifications from store');
    this.store.notifications = [];
    this.notifyListeners();
  }

  hasUnread(): boolean {
    return this.store.notifications.length > 0;
  }

  private notifyListeners() {
    this.store.listeners.forEach(callback => callback());
  }
}

export const notificationStore = new NotificationStoreManager();
