import { AppNotification } from "../../types/notification";
import { BellAlertIcon, CloseIcon } from "../icons";
import "../../styles/notifications.css";

type NotificationToastsProps = {
  toasts: AppNotification[];
  onOpenNotification: (notification: AppNotification) => void;
  onDismiss: (notificationId: string) => void;
};

export default function NotificationToasts({ toasts, onOpenNotification, onDismiss }: NotificationToastsProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="notification-toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="notification-toast">
          <button type="button" className="notification-toast-body" onClick={() => onOpenNotification(toast)}>
            <BellAlertIcon />
            <span>{toast.description}</span>
          </button>
          <button
            type="button"
            className="notification-toast-close"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(toast.id)}
          >
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  );
}
