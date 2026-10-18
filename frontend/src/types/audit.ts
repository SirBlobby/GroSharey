export type AuditCategory = "account" | "profile" | "friends" | "splits" | "payments";

export type AuditEvent = {
  id: string;
  category: AuditCategory;
  action: string;
  description: string;
  actor_username: string | null;
  created_at: string;
};

export type AuditLogPage = {
  events: AuditEvent[];
  total: number;
  page: number;
  page_size: number;
};
