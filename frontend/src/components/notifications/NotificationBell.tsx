import { useEffect, useRef, useState } from "react";

import type { NotificationCenter } from "../../hooks/useNotifications";
import { AppNotification } from "../../types/notification";
import { formatDateTime } from "../../utils";
import { BellIcon, CloseIcon, MarkReadIcon } from "../icons";
import Pagination from "../Pagination";
import "../../styles/notifications.css";

type NotificationBellProps = {
  notificationCenter: NotificationCenter;
  onOpenNotification: (notification: AppNotification) => void;
};

export default function NotificationBell({ notificationCenter, onOpenNotification }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const bellContainer = useRef<HTMLDivElement>(null);
  const { unreadCount, reload } = notificationCenter;

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    reload();
    function closeOnOutsideClick(event: MouseEvent) {
      if (bellContainer.current && !bellContainer.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, reload]);

  function openNotification(notification: AppNotification) {
    setIsOpen(false);
    onOpenNotification(notification);
  }

  return (
    <div className="notification-bell" ref={bellContainer}>
      <button
        type="button"
        className="notification-bell-button"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <BellIcon />
        {unreadCount > 0 && <span className="notification-count">{unreadCount > 99 ? "99+" : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-panel" role="dialog" aria-label="Notifications">
          <div className="notification-panel-header">
            <h2>Notifications</h2>
            <div className="notification-panel-actions">
              <button
                type="button"
                className="notification-panel-button"
                disabled={unreadCount === 0}
                onClick={notificationCenter.markAllRead}
              >
                <MarkReadIcon /> Mark all read
              </button>
              <button
                type="button"
                className="notification-panel-button"
                aria-label="Close notifications"
                onClick={() => setIsOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {notificationCenter.errorMessage && <p className="error-text">{notificationCenter.errorMessage}</p>}
          {notificationCenter.notifications.length === 0 && !notificationCenter.errorMessage && (
            <p className="empty">You're all caught up.</p>
          )}
          {notificationCenter.notifications.length > 0 && (
            <ul className="notification-list">
              {notificationCenter.notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    className={`notification-item ${notification.is_read ? "" : "notification-item--unread"}`}
                    onClick={() => openNotification(notification)}
                  >
                    <span className="notification-dot" aria-hidden="true" />
                    <span className="notification-text">
                      <span className="notification-description">{notification.description}</span>
                      <span className="notification-time">{formatDateTime(notification.created_at)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Pagination
            page={notificationCenter.page}
            pageCount={notificationCenter.pageCount}
            totalCount={notificationCenter.totalCount}
            itemLabel="notifications"
            onPageChange={notificationCenter.setPage}
          />
        </div>
      )}
    </div>
  );
}
