import { useCallback, useEffect, useRef, useState } from "react";

import { notificationsApi } from "../api/notificationsApi";
import { AppNotification, NotificationPage } from "../types/notification";
import { readErrorMessage } from "../utils";

const POLL_INTERVAL_MILLISECONDS = 30000;
const TOAST_DURATION_MILLISECONDS = 6000;
const NOTIFICATION_PAGE_SIZE = 8;

function findNewNotifications(notifications: AppNotification[], newestSeenId: string | null): AppNotification[] {
  const seenIndex = notifications.findIndex((notification) => notification.id === newestSeenId);
  const newerNotifications = seenIndex === -1 ? notifications : notifications.slice(0, seenIndex);
  return newerNotifications.filter((notification) => !notification.is_read);
}

export function useNotifications() {
  const [page, setPage] = useState(1);
  const [notificationPage, setNotificationPage] = useState<NotificationPage | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const newestSeenId = useRef<string | null | undefined>(undefined);

  const dismissToast = useCallback((notificationId: string) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== notificationId));
  }, []);

  const showNewToasts = useCallback(
    (latestNotifications: AppNotification[]) => {
      const newestId = latestNotifications[0]?.id ?? null;
      if (newestSeenId.current === undefined) {
        newestSeenId.current = newestId;
        return;
      }
      const newNotifications = findNewNotifications(latestNotifications, newestSeenId.current);
      newestSeenId.current = newestId;
      if (newNotifications.length === 0) {
        return;
      }
      setToasts((currentToasts) => [...newNotifications, ...currentToasts]);
      for (const notification of newNotifications) {
        setTimeout(() => dismissToast(notification.id), TOAST_DURATION_MILLISECONDS);
      }
    },
    [dismissToast],
  );

  const checkForNewNotifications = useCallback(async () => {
    try {
      const latestPage = await notificationsApi.listNotifications(1, NOTIFICATION_PAGE_SIZE);
      setUnreadCount(latestPage.unread_count);
      showNewToasts(latestPage.notifications);
    } catch {
      return;
    }
  }, [showNewToasts]);

  const loadPage = useCallback(async () => {
    try {
      const loadedPage = await notificationsApi.listNotifications(page, NOTIFICATION_PAGE_SIZE);
      setNotificationPage(loadedPage);
      setUnreadCount(loadedPage.unread_count);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Couldn't load notifications"));
    }
  }, [page]);

  useEffect(() => {
    checkForNewNotifications();
    const pollTimer = setInterval(checkForNewNotifications, POLL_INTERVAL_MILLISECONDS);
    return () => clearInterval(pollTimer);
  }, [checkForNewNotifications]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  async function markRead(notificationId: string) {
    await notificationsApi.markRead([notificationId]).catch(() => null);
    dismissToast(notificationId);
    await loadPage();
  }

  async function markAllRead() {
    await notificationsApi.markAllRead().catch(() => null);
    await loadPage();
  }

  const pageCount = notificationPage ? Math.max(1, Math.ceil(notificationPage.total / NOTIFICATION_PAGE_SIZE)) : 1;

  return {
    notifications: notificationPage?.notifications ?? [],
    totalCount: notificationPage?.total ?? 0,
    unreadCount,
    page,
    pageCount,
    toasts,
    errorMessage,
    setPage,
    reload: loadPage,
    markRead,
    markAllRead,
    dismissToast,
  };
}

export type NotificationCenter = ReturnType<typeof useNotifications>;
