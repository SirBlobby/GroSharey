import { SavedSplit, SplitRequest } from "../types/split";
import { apiClient } from "./apiClient";

export const splitsApi = {
  saveSplit: (splitRequest: SplitRequest) => apiClient.post<SavedSplit>("/splits", splitRequest),
  listSplits: () => apiClient.get<SavedSplit[]>("/splits"),
};
