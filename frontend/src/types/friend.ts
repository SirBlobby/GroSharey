import { PublicProfile } from "./profile";

export type FriendResponse = PublicProfile & {
  balance: number;
  venmo_username: string | null;
  paypal_username: string | null;
  venmo_pay_url: string | null;
  paypal_pay_url: string | null;
};
