import { FormEvent, useState } from "react";

import { Group } from "../../types/group";
import { readErrorMessage } from "../../utils";
import { CloseIcon, TripIcon } from "../icons";
import "../../styles/groups.css";

type TripBannerProps = {
  group: Group;
  currentUsername: string;
  onStartTrip: (groupId: string, store: string) => Promise<void>;
  onEndTrip: (groupId: string) => Promise<void>;
};

export default function TripBanner({ group, currentUsername, onStartTrip, onEndTrip }: TripBannerProps) {
  const [store, setStore] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeTrip = group.active_trip;
  const isShopper = activeTrip?.shopper_username === currentUsername;

  async function runTripAction(action: () => Promise<void>) {
    setIsSending(true);
    setErrorMessage(null);
    try {
      await action();
      setStore("");
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Couldn't update the trip"));
    } finally {
      setIsSending(false);
    }
  }

  function startTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runTripAction(() => onStartTrip(group.id, store.trim()));
  }

  if (activeTrip) {
    return (
      <div className="trip-banner trip-banner--active">
        <TripIcon />
        <span className="trip-banner-text">
          {isShopper ? "You're" : `@${activeTrip.shopper_username} is`} shopping at <strong>{activeTrip.store}</strong>
          {!isShopper && ". Add anything you need to the list."}
        </span>
        {(isShopper || group.owner_username === currentUsername) && (
          <button type="button" className="group-action" disabled={isSending} onClick={() => runTripAction(() => onEndTrip(group.id))}>
            <CloseIcon /> End trip
          </button>
        )}
        {errorMessage && <p className="error-text">{errorMessage}</p>}
      </div>
    );
  }

  return (
    <form className="trip-banner" onSubmit={startTrip}>
      <TripIcon />
      <input
        value={store}
        maxLength={80}
        placeholder="Going to which store?"
        aria-label="Store you're going to"
        onChange={(event) => setStore(event.target.value)}
      />
      <button type="submit" className="group-action" disabled={isSending || store.trim().length === 0}>
        I'm going shopping
      </button>
      {errorMessage && <p className="error-text">{errorMessage}</p>}
    </form>
  );
}
