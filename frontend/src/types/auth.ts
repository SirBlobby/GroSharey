import { PublicProfile } from "./profile";

export type User = PublicProfile & {
  email: string;
  created_at: string;
  venmo_username: string | null;
  paypal_username: string | null;
};

export type PaymentHandles = {
  venmo_username: string | null;
  paypal_username: string | null;
};

export type LogInCredentials = {
  email: string;
  password: string;
};

export type SignUpDetails = LogInCredentials & {
  username: string;
  display_name: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export type UsernameChange = {
  username: string;
  current_password: string;
};

export type PasswordChange = {
  current_password: string;
  new_password: string;
};
