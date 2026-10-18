import { ParsedReceipt } from "../types/receipt";
import { apiClient } from "./apiClient";

export const receiptsApi = {
  parseReceipt: (imageBase64: string) =>
    apiClient.post<ParsedReceipt>("/receipts/parse", { image_base64: imageBase64 }),
};
