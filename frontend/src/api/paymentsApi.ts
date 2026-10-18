import { RecordPaymentRequest } from "../types/payment";
import { apiClient } from "./apiClient";

export const paymentsApi = {
  recordPayment: (paymentRequest: RecordPaymentRequest) => apiClient.post<unknown>("/payments", paymentRequest),
};
