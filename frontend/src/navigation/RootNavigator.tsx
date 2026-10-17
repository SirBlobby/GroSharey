import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "../hooks/useAuth";
import LogInScreen from "../screens/LogInScreen";
import SignUpScreen from "../screens/SignUpScreen";
import { colors } from "../theme/colors";
import AppNavigator from "./AppNavigator";

type AuthPage = "logIn" | "signUp";

export default function RootNavigator() {
  const { currentUser, isLoading } = useAuth();
  const [authPage, setAuthPage] = useState<AuthPage>("logIn");

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
