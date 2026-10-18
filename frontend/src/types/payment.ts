export type PaymentDirection = "paid" | "received";

export type RecordPaymentRequest = {
  friend_username: string;
  amount: number;
  direction: PaymentDirection;
  method: "venmo" | "paypal" | "cash" | "other";
};

export type Payment = {
  id: string;
  from_username: string;
  to_username: string;
  amount: number;
  method: RecordPaymentRequest["method"];
  recorded_by: string;
  status: "pending" | "confirmed";
  confirmed_at: string | null;
  created_at: string;
};
