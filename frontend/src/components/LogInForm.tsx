import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { useFormSubmission } from "../hooks/useFormSubmission";
import { spacing } from "../theme/spacing";
import { LogInCredentials } from "../types/auth";
import ErrorMessage from "./ErrorMessage";
import PrimaryButton from "./PrimaryButton";
import TextField from "./TextField";

type LogInFormProps = {
  onSubmit: (credentials: LogInCredentials) => Promise<void>;
};

export default function LogInForm({ onSubmit }: LogInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { errorMessage, isSubmitting, submit } = useFormSubmission(onSubmit);

  const isSubmitDisabled = email.trim().length === 0 || password.length === 0;

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
        autoCapitalize="none"
        secureTextEntry
      />
      {errorMessage && <ErrorMessage message={errorMessage} />}
      <PrimaryButton
        label="Log In"
        onPress={() => submit({ email: email.trim(), password })}
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
});
