import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { AuthCredentials } from "../types/auth";
import PrimaryButton from "./PrimaryButton";
import TextField from "./TextField";

type AuthFormProps = {
  submitLabel: string;
  onSubmit: (credentials: AuthCredentials) => Promise<void>;
};

export default function AuthForm({ submitLabel, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSubmitDisabled = email.trim().length === 0 || password.length === 0;

  async function handleSubmit() {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit({ email: email.trim(), password });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.form}>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        autoCapitalize="none"
        secureTextEntry
      />
      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
      <PrimaryButton
        label={submitLabel}
        onPress={handleSubmit}
        isDisabled={isSubmitDisabled}
        isLoading={isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.medium,
  },
  error: {
    color: colors.danger,
  },
});
