import { AuthCredentials, AuthResponse, User } from "../types/auth";
import { apiClient } from "./apiClient";

export const authApi = {
  signUp: (credentials: AuthCredentials) => apiClient.post<AuthResponse>("/auth/signup", credentials),
  logIn: (credentials: AuthCredentials) => apiClient.post<AuthResponse>("/auth/login", credentials),
  getCurrentUser: () => apiClient.get<User>("/auth/me"),
};
