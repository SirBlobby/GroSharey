import { FormEvent, useState } from "react";

import AuthCard from "../components/AuthCard";
import AuthField from "../components/AuthField";
import { useAuth } from "../hooks/useAuth";
import { useFormSubmission } from "../hooks/useFormSubmission";

type LogInScreenProps = {
  onShowSignUp: () => void;
};

export default function LogInScreen({ onShowSignUp }: LogInScreenProps) {
  const { logIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { errorMessage, isSubmitting, submit } = useFormSubmission(logIn);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit({ email: email.trim(), password });
  }

  return (
    <AuthCard switchPageLabel="Need an account? Create one" onSwitchPage={onShowSignUp}>
      <form className="auth-form" onSubmit={handleSubmit}>
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {errorMessage && <p className="error-text">{errorMessage}</p>}
        <button type="submit" className="btn" disabled={isSubmitting}>
          {isSubmitting ? "Logging In..." : "Log In"}
        </button>
      </form>
    </AuthCard>
  );
}
