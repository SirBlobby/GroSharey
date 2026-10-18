import { PriceWatch, YearlyRecap } from "../types/insights";
import { apiClient } from "./apiClient";

export const insightsApi = {
  getPriceWatch: () => apiClient.get<PriceWatch>("/insights/prices"),
  getRecap: (year: number, groupId: string | null) =>
    apiClient.get<YearlyRecap>(`/insights/recap?year=${year}${groupId ? `&group_id=${groupId}` : ""}`),
};
