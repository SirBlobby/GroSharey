import { AuditEvent } from "../types/audit";
import { apiClient } from "./apiClient";

export const auditLogApi = {
  listEvents: () => apiClient.get<AuditEvent[]>("/audit-log"),
};
