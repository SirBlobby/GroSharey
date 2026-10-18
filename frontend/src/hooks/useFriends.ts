import { useCallback, useEffect, useState } from "react";

import { addFriendByUsername, loadFriends, removeFriendByUsername, settleBalance } from "../services/friends";
import type { Friend } from "../types";
import { readErrorMessage } from "../utils";

function sortByName(friends: Friend[]): Friend[] {
  return [...friends].sort((first, second) => first.name.localeCompare(second.name));
}

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshFriends = useCallback(async () => {
    try {
      const loadedFriends = await loadFriends();
      setFriends(loadedFriends);
      setSelectedUsername((currentUsername) => currentUsername ?? loadedFriends[0]?.username ?? null);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Couldn't load your friends"));
    }
  }, []);

  useEffect(() => {
    refreshFriends();
  }, [refreshFriends]);

  async function addFriend(username: string): Promise<Friend> {
    const addedFriend = await addFriendByUsername(username);
    setFriends((currentFriends) =>
      sortByName([...currentFriends.filter((friend) => friend.username !== addedFriend.username), addedFriend]),
    );
    return addedFriend;
  }

  async function removeFriend(username: string): Promise<void> {
    await removeFriendByUsername(username);
    setFriends((currentFriends) => currentFriends.filter((friend) => friend.username !== username));
    setSelectedUsername((currentUsername) => (currentUsername === username ? null : currentUsername));
  }

  async function settleUp(friend: Friend): Promise<void> {
    await settleBalance(friend);
    await refreshFriends();
  }

  const selectedFriend = friends.find((friend) => friend.username === selectedUsername);

  return {
    friends,
    selectedFriend,
    errorMessage,
    selectFriend: setSelectedUsername,
    addFriend,
    removeFriend,
    settleUp,
    refreshFriends,
  };
}
