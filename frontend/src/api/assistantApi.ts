import { AssistantReply, AssistantRequest } from "../types/assistant";
import { apiClient } from "./apiClient";

export const assistantApi = {
  ask: (assistantRequest: AssistantRequest) => apiClient.post<AssistantReply>("/assistant", assistantRequest),
};
