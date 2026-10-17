import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { useFormSubmission } from "../hooks/useFormSubmission";
import { spacing } from "../theme/spacing";
import { SignUpDetails } from "../types/auth";
import ErrorMessage from "./ErrorMessage";
import PrimaryButton from "./PrimaryButton";
import TextField from "./TextField";

type SignUpFormProps = {
  onSubmit: (signUpDetails: SignUpDetails) => Promise<void>;
};

export default function SignUpForm({ onSubmit }: SignUpFormProps) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { errorMessage, isSubmitting, submit } = useFormSubmission(onSubmit);

  const requiredValues = [displayName.trim(), username.trim(), email.trim(), password];
  const isSubmitDisabled = requiredValues.some((value) => value.length === 0);

  function handleSubmit() {
    submit({
      display_name: displayName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim(),
      password,
    });
  }

  return (
    <View style={styles.form}>
      <TextField
        label="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Alex Smith"
        autoComplete="name"
      />
      <TextField
        label="Username"
        value={username}
        onChangeText={setUsername}
        placeholder="alex_smith"
        autoCapitalize="none"
        autoComplete="username"
      />
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
      {errorMessage && <ErrorMessage message={errorMessage} />}
      <PrimaryButton
        label="Create Account"
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
});
