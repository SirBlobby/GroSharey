import { FormEvent, useState } from "react";

import { profilesApi } from "../../api/profilesApi";
import { useAuth } from "../../hooks/useAuth";
import { useFormSubmission } from "../../hooks/useFormSubmission";
import { PaymentHandles } from "../../types/auth";
import { LogOutIcon } from "../icons";

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function AccountSettings() {
  const { currentUser, logOut, updateCurrentUser } = useAuth();
  const [venmoUsername, setVenmoUsername] = useState(currentUser?.venmo_username ?? "");
  const [paypalUsername, setPaypalUsername] = useState(currentUser?.paypal_username ?? "");
  const [isSaved, setIsSaved] = useState(false);
  const { errorMessage, isSubmitting, submit } = useFormSubmission(async (paymentHandles: PaymentHandles) => {
    updateCurrentUser(await profilesApi.updatePaymentHandles(paymentHandles));
    setIsSaved(true);
  });

  if (!currentUser) {
    return null;
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaved(false);
    submit({
      venmo_username: venmoUsername.trim() || null,
      paypal_username: paypalUsername.trim() || null,
    });
  }

  return (
    <div className="card settings-panel">
      <h2>Account</h2>

      <dl className="detail-list">
        <dt>Email</dt>
        <dd>{currentUser.email}</dd>
        <dt>Username</dt>
        <dd>@{currentUser.username}</dd>
        <dt>Member since</dt>
        <dd>{formatDate(currentUser.created_at)}</dd>
      </dl>

      <form className="settings-group" onSubmit={handleSave}>
        <h3>Payment Links</h3>
        <p className="description">Friends who owe you get a one tap link to pay you.</p>
        <label className="settings-field">
          <span>Venmo username</span>
          <input
            value={venmoUsername}
            placeholder="your-venmo"
            autoCapitalize="none"
            onChange={(event) => setVenmoUsername(event.target.value)}
          />
        </label>
        <label className="settings-field">
          <span>PayPal.me name</span>
          <input
            value={paypalUsername}
            placeholder="yourpaypal"
            autoCapitalize="none"
            onChange={(event) => setPaypalUsername(event.target.value)}
          />
        </label>
        {errorMessage && <p className="error-text">{errorMessage}</p>}
        {isSaved && <p className="status-text">Payment links saved!</p>}
        <button type="submit" className="btn" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </form>

      <div className="settings-group">
        <h3>Session</h3>
        <button type="button" className="btn danger-button" onClick={logOut}>
          <LogOutIcon /> Log Out
        </button>
      </div>
    </div>
  );
}
