import { useState } from "react";

import { friendsApi } from "../../api/friendsApi";
import { ReminderResult } from "../../types/friend";
import { formatDateTime, readErrorMessage } from "../../utils";
import { ReminderIcon } from "../icons";
import "../../styles/payments.css";

type ReminderButtonProps = {
  usernames: string[] | null;
  label: string;
  className?: string;
};

function describeResult(reminderResult: ReminderResult): string {
  const parts = [];
  if (reminderResult.reminded.length > 0) {
    const names = reminderResult.reminded.map((username) => `@${username}`).join(", ");
    parts.push(`Reminder sent to ${names}.`);
  }
  for (const username of reminderResult.reminded_recently) {
    const nextReminderTime = reminderResult.next_reminder_times[username];
    const waitText = nextReminderTime ? ` You can remind them again after ${formatDateTime(nextReminderTime)}.` : "";
    parts.push(`@${username} already got a reminder in the last 24 hours.${waitText}`);
  }
  return parts.join(" ") || "Nobody owes you right now.";
}

export default function ReminderButton({ usernames, label, className = "" }: ReminderButtonProps) {
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function sendReminders() {
    setIsSending(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      setStatusMessage(describeResult(await friendsApi.remindFriends(usernames)));
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Couldn't send the reminder"));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className={`reminder ${className}`}>
      <button type="button" className="reminder-button" disabled={isSending} onClick={sendReminders}>
        <ReminderIcon /> {isSending ? "Sending..." : label}
      </button>
      {statusMessage && <p className="reminder-status">{statusMessage}</p>}
      {errorMessage && <p className="error-text">{errorMessage}</p>}
    </div>
  );
}
