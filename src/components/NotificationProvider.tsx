import { useNotifications } from '@/hooks/useNotifications';
import { OrderNotificationModal } from '@/components/OrderNotificationModal';

export const NotificationProvider = () => {
  const { newOrderModal, statusModal, closeNewOrderModal, closeStatusModal } = useNotifications();

  return (
    <>
      {/* New Order Modal for Business Owners */}
      <OrderNotificationModal
        order={newOrderModal.order}
        isOpen={newOrderModal.isOpen}
        onClose={closeNewOrderModal}
        type="new-order"
      />

      {/* Status Change Modal for Customers */}
      <OrderNotificationModal
        order={statusModal.order}
        isOpen={statusModal.isOpen}
        onClose={closeStatusModal}
        type="status-change"
      />
    </>
  );
};