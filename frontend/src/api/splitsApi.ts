import { SavedSplit, SplitRequest } from "../types/split";
import { apiClient } from "./apiClient";

export const splitsApi = {
  saveSplit: (splitRequest: SplitRequest) => apiClient.post<SavedSplit>("/splits", splitRequest),
  listSplits: () => apiClient.get<SavedSplit[]>("/splits"),
  downloadReport: (month: string) => apiClient.download(`/splits/report.pdf?month=${encodeURIComponent(month)}`),
  disputeItem: (splitId: string, itemId: string, reason: string | null) =>
    apiClient.post<SavedSplit>(`/splits/${splitId}/disputes`, { item_id: itemId, reason }),
  resolveDispute: (splitId: string, disputeId: string, resolution: "dismissed" | "removed") =>
    apiClient.patch<SavedSplit>(`/splits/${splitId}/disputes/${disputeId}`, { resolution }),
};
