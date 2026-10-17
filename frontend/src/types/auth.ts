export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};
