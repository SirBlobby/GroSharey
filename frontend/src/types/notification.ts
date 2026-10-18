import { AuditEvent } from "./audit";

export type AppNotification = AuditEvent & {
  is_read: boolean;
};

export type NotificationPage = {
  notifications: AppNotification[];
  total: number;
  unread_count: number;
  page: number;
  page_size: number;
};
