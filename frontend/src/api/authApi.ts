import { AuthResponse, LogInCredentials, SignUpDetails, User } from "../types/auth";
import { apiClient } from "./apiClient";

export const authApi = {
  signUp: (signUpDetails: SignUpDetails) => apiClient.post<AuthResponse>("/auth/signup", signUpDetails),
  logIn: (credentials: LogInCredentials) => apiClient.post<AuthResponse>("/auth/login", credentials),
  getCurrentUser: () => apiClient.get<User>("/auth/me"),
  logOut: () => apiClient.post<null>("/auth/logout", {}),
};
