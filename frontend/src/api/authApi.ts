import { AuthResponse, LogInCredentials, PasswordChange, SignUpDetails, User, UsernameChange } from "../types/auth";
import { apiClient } from "./apiClient";

export const authApi = {
  signUp: (signUpDetails: SignUpDetails) => apiClient.post<AuthResponse>("/auth/signup", signUpDetails),
  logIn: (credentials: LogInCredentials) => apiClient.post<AuthResponse>("/auth/login", credentials),
  getCurrentUser: () => apiClient.get<User>("/auth/me"),
  logOut: () => apiClient.post<null>("/auth/logout", {}),
  changeUsername: (usernameChange: UsernameChange) => apiClient.put<User>("/auth/me/username", usernameChange),
  changePassword: (passwordChange: PasswordChange) => apiClient.put<null>("/auth/me/password", passwordChange),
};
