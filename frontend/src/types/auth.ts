import { PublicProfile } from "./profile";

export type User = PublicProfile & {
  email: string;
  created_at: string;
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
