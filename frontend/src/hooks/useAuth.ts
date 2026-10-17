import { useContext } from "react";

import { AuthContext } from "../context/AuthContext";

export function useAuth() {
  const authContextValue = useContext(AuthContext);
  if (!authContextValue) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return authContextValue;
}
