import { useState } from "react";

import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";
import LogInScreen from "../screens/LogInScreen";
import SignUpScreen from "../screens/SignUpScreen";
import AppNavigator from "./AppNavigator";

type AuthPage = "logIn" | "signUp";

export default function RootNavigator() {
  const { currentUser, isLoading } = useAuth();
  const [authPage, setAuthPage] = useState<AuthPage>("logIn");

  if (isLoading) {
    return (
      <section className="screen loading-screen" aria-busy="true">
        <Logo className="loading-logo" />
        <p>Loading...</p>
      </section>
    );
  }

  if (currentUser) {
    return <AppNavigator />;
  }

  if (authPage === "signUp") {
    return <SignUpScreen onShowLogIn={() => setAuthPage("logIn")} />;
  }

  return <LogInScreen onShowSignUp={() => setAuthPage("signUp")} />;
}
