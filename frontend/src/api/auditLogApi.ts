import { AuditCategory, AuditLogPage } from "../types/audit";
import { apiClient } from "./apiClient";

export type AuditLogRequest = {
  page: number;
  pageSize: number;
  category: AuditCategory | null;
};

function buildAuditLogQuery({ page, pageSize, category }: AuditLogRequest): string {
  const queryParameters = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (category) {
    queryParameters.set("category", category);
  }
  return queryParameters.toString();
}

export const auditLogApi = {
  listEvents: (auditLogRequest: AuditLogRequest) =>
    apiClient.get<AuditLogPage>(`/audit-log?${buildAuditLogQuery(auditLogRequest)}`),
};
