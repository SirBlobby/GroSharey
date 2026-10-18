import { useCallback, useEffect, useState } from "react";

import { paymentsApi } from "../api/paymentsApi";
import { Payment } from "../types/payment";
import { readErrorMessage } from "../utils";

export function usePendingPayments(currentUsername: string) {
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshPendingPayments = useCallback(async () => {
    try {
      setPendingPayments(await paymentsApi.listPendingPayments());
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Couldn't load payments waiting for confirmation"));
    }
  }, []);

  useEffect(() => {
    refreshPendingPayments();
  }, [refreshPendingPayments]);

  async function confirmPayment(paymentId: string): Promise<void> {
    await paymentsApi.confirmPayment(paymentId);
    setPendingPayments((currentPayments) => currentPayments.filter((payment) => payment.id !== paymentId));
  }

  const paymentsToConfirm = pendingPayments.filter((payment) => payment.to_username === currentUsername);
  const paymentsAwaitingFriends = pendingPayments.filter((payment) => payment.from_username === currentUsername);

  return { paymentsToConfirm, paymentsAwaitingFriends, errorMessage, refreshPendingPayments, confirmPayment };
}

export type PendingPaymentCenter = ReturnType<typeof usePendingPayments>;
