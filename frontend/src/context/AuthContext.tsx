import { createContext, ReactNode, useEffect, useState } from "react";

import { authApi } from "../api/authApi";
import { getAccessToken, removeAccessToken, saveAccessToken } from "../storage/tokenStorage";
import { AuthResponse, LogInCredentials, SignUpDetails, User } from "../types/auth";

type AuthContextValue = {
  currentUser: User | null;
  isLoading: boolean;
  signUp: (signUpDetails: SignUpDetails) => Promise<void>;
  logIn: (credentials: LogInCredentials) => Promise<void>;
  logOut: () => Promise<void>;
  updateCurrentUser: (updatedUser: User) => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const accessToken = await getAccessToken();
      if (accessToken) {
        setCurrentUser(await authApi.getCurrentUser());
      }
    } catch {
      await removeAccessToken();
    } finally {
      setIsLoading(false);
    }
  }

  async function completeAuthentication(authResponse: AuthResponse) {
    await saveAccessToken(authResponse.access_token);
    setCurrentUser(authResponse.user);
  }

  async function signUp(signUpDetails: SignUpDetails) {
    await completeAuthentication(await authApi.signUp(signUpDetails));
  }

  async function logIn(credentials: LogInCredentials) {
    await completeAuthentication(await authApi.logIn(credentials));
  }

  async function logOut() {
    await authApi.logOut().catch(() => null);
    await removeAccessToken();
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ currentUser, isLoading, signUp, logIn, logOut, updateCurrentUser: setCurrentUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
