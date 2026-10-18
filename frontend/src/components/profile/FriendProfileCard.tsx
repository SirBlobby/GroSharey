import { useState } from "react";

import type { Friend } from "../../types";
import { PublicProfile } from "../../types/profile";
import { readErrorMessage } from "../../utils";
import { AddFriendIcon, CheckIcon, RemoveFriendIcon } from "../icons";
import ProfileAvatar from "../ProfileAvatar";

type FriendProfileCardProps = {
  profile: PublicProfile;
  friend: Friend | undefined;
  isOwnProfile: boolean;
  onAddFriend: (username: string) => Promise<Friend>;
  onRemoveFriend: (username: string) => Promise<void>;
};

export default function FriendProfileCard({
  profile,
  friend,
  isOwnProfile,
  onAddFriend,
  onRemoveFriend,
}: FriendProfileCardProps) {
  const [isWorking, setIsWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function runFriendAction(friendAction: () => Promise<unknown>, fallbackError: string) {
    setIsWorking(true);
    setErrorMessage(null);
    try {
      await friendAction();
    } catch (error) {
      setErrorMessage(readErrorMessage(error, fallbackError));
    } finally {
      setIsWorking(false);
    }
  }

  function confirmRemove() {
    if (window.confirm(`Remove ${profile.display_name} from your friends?`)) {
      runFriendAction(() => onRemoveFriend(profile.username), "Couldn't remove this friend");
    }
  }

  return (
    <aside className="card friend-profile-card">
      <ProfileAvatar profile={profile} />
      <span className="friend-profile-name">{profile.display_name}</span>
      <span className="handle">@{profile.username}</span>

      {isOwnProfile && <span className="friend-status">This is you</span>}
      {!isOwnProfile && friend && (
        <span className="friend-status friend-status--friends">
          <CheckIcon /> Friends
        </span>
      )}

      {!isOwnProfile && !friend && (
        <button
          type="button"
          className="btn friend-profile-action"
          disabled={isWorking}
          onClick={() => runFriendAction(() => onAddFriend(profile.username), "Couldn't add this friend")}
        >
          <AddFriendIcon /> {isWorking ? "Adding..." : "Add Friend"}
        </button>
      )}
      {!isOwnProfile && friend && (
        <button
          type="button"
          className="btn friend-profile-action danger-button"
          disabled={isWorking}
          onClick={confirmRemove}
        >
          <RemoveFriendIcon /> {isWorking ? "Removing..." : "Remove Friend"}
        </button>
      )}
      {errorMessage && <p className="error-text">{errorMessage}</p>}
    </aside>
  );
}
