import { FormEvent, useState } from "react";

import AuthCard from "../components/AuthCard";
import AuthField from "../components/AuthField";
import { useAuth } from "../hooks/useAuth";
import { useFormSubmission } from "../hooks/useFormSubmission";

type SignUpScreenProps = {
  onShowLogIn: () => void;
};

export default function SignUpScreen({ onShowLogIn }: SignUpScreenProps) {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { errorMessage, isSubmitting, submit } = useFormSubmission(signUp);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit({
      display_name: displayName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim(),
      password,
    });
  }

  return (
    <AuthCard switchPageLabel="Already have an account? Log in" onSwitchPage={onShowLogIn}>
      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthField
          label="Display Name"
          autoComplete="name"
          placeholder="Alex Smith"
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
        <AuthField
          label="Username"
          autoComplete="username"
          autoCapitalize="none"
          placeholder="alex_smith"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <AuthField
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {errorMessage && <p className="error-text">{errorMessage}</p>}
        <button type="submit" className="btn" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Account"}
        </button>
      </form>
    </AuthCard>
  );
}
