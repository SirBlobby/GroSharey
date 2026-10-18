import { useCallback, useEffect, useState } from "react";

import { auditLogApi } from "../api/auditLogApi";
import { AuditEvent } from "../types/audit";
import { readErrorMessage } from "../utils";

export function useAuditLog() {
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshAuditLog = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      setAuditEvents(await auditLogApi.listEvents());
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Couldn't load your audit log"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuditLog();
  }, [refreshAuditLog]);

  return { auditEvents, isLoading, errorMessage, refreshAuditLog };
}
