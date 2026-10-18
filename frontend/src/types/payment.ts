export type PaymentDirection = "paid" | "received";

export type RecordPaymentRequest = {
  friend_username: string;
  amount: number;
  direction: PaymentDirection;
  method: "venmo" | "paypal" | "cash" | "other";
};
