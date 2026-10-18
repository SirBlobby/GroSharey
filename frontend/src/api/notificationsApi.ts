import { NotificationPage } from "../types/notification";
import { apiClient } from "./apiClient";

export const notificationsApi = {
  listNotifications: (page: number, pageSize: number) =>
    apiClient.get<NotificationPage>(`/notifications?page=${page}&page_size=${pageSize}`),
  markRead: (notificationIds: string[]) =>
    apiClient.post<null>("/notifications/read", { notification_ids: notificationIds }),
  markAllRead: () => apiClient.post<null>("/notifications/read", {}),
};
