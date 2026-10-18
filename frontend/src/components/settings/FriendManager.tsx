import { FormEvent, useState } from "react";

import { usePagination } from "../../hooks/usePagination";
import type { Friend } from "../../types";
import { readErrorMessage } from "../../utils";
import FriendManagerRow from "./FriendManagerRow";
import { AddFriendIcon } from "../icons";
import Pagination from "../Pagination";

type FriendManagerProps = {
  friends: Friend[];
  onAddFriend: (username: string) => Promise<Friend>;
  onRemoveFriend: (username: string) => Promise<void>;
  onViewProfile: (username: string) => void;
};

export default function FriendManager({ friends, onAddFriend, onRemoveFriend, onViewProfile }: FriendManagerProps) {
  const [newUsername, setNewUsername] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const friendPages = usePagination(friends);

  const normalizedUsername = newUsername.trim().toLowerCase().replace(/^@/, "");

  async function runAction(action: () => Promise<string>, fallbackError: string) {
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      setStatusMessage(await action());
    } catch (error) {
      setErrorMessage(readErrorMessage(error, fallbackError));
    }
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (normalizedUsername.length === 0) {
      return;
    }
    setIsAdding(true);
    await runAction(async () => {
      const addedFriend = await onAddFriend(normalizedUsername);
      setNewUsername("");
      return `${addedFriend.name} was added!`;
    }, "Couldn't add that friend");
    setIsAdding(false);
  }

  function removeFriend(friend: Friend) {
    return runAction(async () => {
      await onRemoveFriend(friend.username);
      return `${friend.name} was removed.`;
    }, "Couldn't remove that friend");
  }

  return (
    <div className="card settings-panel friend-manager">
      <div className="friend-manager-header">
        <h2>Friends</h2>
        <span className="friend-count">{friends.length}</span>
      </div>

      <form className="add-friend-form" onSubmit={handleAdd}>
        <label htmlFor="add-friend-username">Add a friend by username</label>
        <div className="find-row">
          <input
            id="add-friend-username"
            value={newUsername}
            placeholder="username"
            autoCapitalize="none"
            onChange={(event) => setNewUsername(event.target.value)}
          />
          <button
            type="button"
            className="btn"
            disabled={normalizedUsername.length === 0}
            onClick={() => onViewProfile(normalizedUsername)}
          >
            View
          </button>
          <button type="submit" className="btn" disabled={isAdding || normalizedUsername.length === 0}>
            <AddFriendIcon /> {isAdding ? "Adding..." : "Add"}
          </button>
        </div>
        {statusMessage && <p className="status-text">{statusMessage}</p>}
        {errorMessage && <p className="error-text">{errorMessage}</p>}
      </form>

      {friends.length === 0 ? (
        <p className="empty">No friends yet.<br />Add one by username or have them scan your QR code.</p>
      ) : (
        <ul className="manager-list">
          {friendPages.pageItems.map((friend) => (
            <FriendManagerRow
              key={friend.username}
              friend={friend}
              onView={() => onViewProfile(friend.username)}
              onRemove={() => removeFriend(friend)}
            />
          ))}
        </ul>
      )}
      <Pagination
        page={friendPages.page}
        pageCount={friendPages.pageCount}
        totalCount={friendPages.totalCount}
        itemLabel="friends"
        onPageChange={friendPages.setPage}
      />
    </div>
  );
}
