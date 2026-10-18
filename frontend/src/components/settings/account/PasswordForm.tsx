import { FormEvent, useState } from "react";

import { authApi } from "../../../api/authApi";
import { useFormSubmission } from "../../../hooks/useFormSubmission";
import { PasswordChange } from "../../../types/auth";
import PasswordInput from "../../PasswordInput";

const MINIMUM_PASSWORD_LENGTH = 8;

export default function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const { errorMessage, isSubmitting, submit, setErrorMessage } = useFormSubmission(
    async (passwordChange: PasswordChange) => {
      await authApi.changePassword(passwordChange);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmedPassword("");
      setIsSaved(true);
    },
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaved(false);
    if (newPassword.length < MINIMUM_PASSWORD_LENGTH) {
      setErrorMessage(`Your new password needs at least ${MINIMUM_PASSWORD_LENGTH} characters`);
      return;
    }
    if (newPassword !== confirmedPassword) {
      setErrorMessage("The new passwords don't match");
      return;
    }
    submit({ current_password: currentPassword, new_password: newPassword });
  }

  return (
    <form className="settings-group" onSubmit={handleSubmit}>
      <h3>Password</h3>
      <label className="settings-field">
        <span>Current password</span>
        <PasswordInput
          value={currentPassword}
          autoComplete="current-password"
          required
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </label>
      <label className="settings-field">
        <span>New password</span>
        <PasswordInput
          value={newPassword}
          autoComplete="new-password"
          placeholder={`At least ${MINIMUM_PASSWORD_LENGTH} characters`}
          required
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </label>
      <label className="settings-field">
        <span>Confirm new password</span>
        <PasswordInput
          value={confirmedPassword}
          autoComplete="new-password"
          required
          onChange={(event) => setConfirmedPassword(event.target.value)}
        />
      </label>
      {errorMessage && <p className="error-text">{errorMessage}</p>}
      {isSaved && <p className="status-text">Password changed!</p>}
      <button type="submit" className="btn" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Change Password"}
      </button>
    </form>
  );
}
