import { FormEvent, useState } from "react";

import { authApi } from "../../../api/authApi";
import { useAuth } from "../../../hooks/useAuth";
import { useFormSubmission } from "../../../hooks/useFormSubmission";
import { UsernameChange } from "../../../types/auth";
import PasswordInput from "../../PasswordInput";

export default function UsernameForm() {
  const { currentUser, updateCurrentUser } = useAuth();
  const [username, setUsername] = useState(currentUser?.username ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [savedUsername, setSavedUsername] = useState<string | null>(null);
  const { errorMessage, isSubmitting, submit } = useFormSubmission(async (usernameChange: UsernameChange) => {
    const updatedUser = await authApi.changeUsername(usernameChange);
    updateCurrentUser(updatedUser);
    setUsername(updatedUser.username);
    setCurrentPassword("");
    setSavedUsername(updatedUser.username);
  });

  const normalizedUsername = username.trim().toLowerCase().replace(/^@/, "");
  const hasChanged = normalizedUsername.length > 0 && normalizedUsername !== currentUser?.username;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavedUsername(null);
    submit({ username: normalizedUsername, current_password: currentPassword });
  }

  return (
    <form className="settings-group" onSubmit={handleSubmit}>
      <h3>Username</h3>
      <p className="description">3 to 30 letters, numbers, or underscores. Usernames are unique.</p>
      <label className="settings-field">
        <span>New username</span>
        <input
          value={username}
          autoCapitalize="none"
          autoComplete="username"
          onChange={(event) => setUsername(event.target.value)}
        />
      </label>
      <label className="settings-field">
        <span>Current password</span>
        <PasswordInput
          value={currentPassword}
          autoComplete="current-password"
          required
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </label>
      {errorMessage && <p className="error-text">{errorMessage}</p>}
      {savedUsername && <p className="status-text">Your username is now @{savedUsername}</p>}
      <button type="submit" className="btn" disabled={isSubmitting || !hasChanged}>
        {isSubmitting ? "Saving..." : "Change Username"}
      </button>
    </form>
  );
}
