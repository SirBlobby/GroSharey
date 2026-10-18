import { useState } from "react";

import Logo from "../components/Logo";
import { isRunningInMobileApp } from "../config/platform";
import { useAuth } from "../hooks/useAuth";
import { readSharedUsername } from "../linking/sharedProfile";
import LandingScreen from "../screens/LandingScreen";
import LogInScreen from "../screens/LogInScreen";
import SignUpScreen from "../screens/SignUpScreen";
import AppNavigator from "./AppNavigator";

type AuthPage = "landing" | "logIn" | "signUp";

function getInitialAuthPage(): AuthPage {
  return isRunningInMobileApp() || readSharedUsername() ? "logIn" : "landing";
}

export default function RootNavigator() {
  const { currentUser, isLoading } = useAuth();
  const [authPage, setAuthPage] = useState<AuthPage>(getInitialAuthPage);
  const showLanding = isRunningInMobileApp() ? undefined : () => setAuthPage("landing");

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

  if (authPage === "landing") {
    return <LandingScreen onShowLogIn={() => setAuthPage("logIn")} onShowSignUp={() => setAuthPage("signUp")} />;
  }

  if (authPage === "signUp") {
    return <SignUpScreen onShowLogIn={() => setAuthPage("logIn")} onShowLanding={showLanding} />;
  }

  return <LogInScreen onShowSignUp={() => setAuthPage("signUp")} onShowLanding={showLanding} />;
}
