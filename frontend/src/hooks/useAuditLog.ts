import { useCallback, useEffect, useState } from "react";

import { auditLogApi } from "../api/auditLogApi";
import { AuditCategory, AuditEvent } from "../types/audit";
import { readErrorMessage } from "../utils";

const AUDIT_LOG_PAGE_SIZE = 15;

export function useAuditLog(category: AuditCategory | null, page: number) {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshAuditLog = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const auditLogPage = await auditLogApi.listEvents({ page, pageSize: AUDIT_LOG_PAGE_SIZE, category });
      setAuditEvents(auditLogPage.events);
      setTotalCount(auditLogPage.total);
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Couldn't load your audit log"));
    } finally {
      setIsLoading(false);
    }
  }, [category, page]);

  useEffect(() => {
    refreshAuditLog();
  }, [refreshAuditLog]);

  const pageCount = Math.max(1, Math.ceil(totalCount / AUDIT_LOG_PAGE_SIZE));

  return { auditEvents, totalCount, pageCount, isLoading, errorMessage, refreshAuditLog };
}
