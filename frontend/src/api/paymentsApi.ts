import { Payment, RecordPaymentRequest } from "../types/payment";
import { apiClient } from "./apiClient";

export const paymentsApi = {
  recordPayment: (paymentRequest: RecordPaymentRequest) => apiClient.post<Payment>("/payments", paymentRequest),
  listPendingPayments: () => apiClient.get<Payment[]>("/payments/pending"),
  confirmPayment: (paymentId: string) => apiClient.post<Payment>(`/payments/${paymentId}/confirm`, {}),
};
