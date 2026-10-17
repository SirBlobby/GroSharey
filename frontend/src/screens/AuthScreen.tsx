import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import AuthForm from "../components/AuthForm";
import { useAuth } from "../hooks/useAuth";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { AuthCredentials } from "../types/auth";

type AuthMode = "logIn" | "signUp";

export default function AuthScreen() {
  const { logIn, signUp } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>("logIn");

  const isLogInMode = authMode === "logIn";

  async function handleSubmit(credentials: AuthCredentials) {
    if (isLogInMode) {
      await logIn(credentials);
    } else {
      await signUp(credentials);
    }
  }

  function toggleAuthMode() {
    setAuthMode(isLogInMode ? "signUp" : "logIn");
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{isLogInMode ? "Log In" : "Create Account"}</Text>
        <AuthForm
          key={authMode}
          submitLabel={isLogInMode ? "Log In" : "Sign Up"}
          onSubmit={handleSubmit}
        />
        <Pressable onPress={toggleAuthMode}>
          <Text style={styles.switchModeText}>
            {isLogInMode ? "Need an account? Sign up" : "Already have an account? Log in"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.large,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    width: "100%",
    maxWidth: 400,
    gap: spacing.medium,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  switchModeText: {
    color: colors.primary,
    textAlign: "center",
  },
});
