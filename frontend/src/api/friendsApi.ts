import { FriendResponse } from "../types/friend";
import { apiClient } from "./apiClient";

export const friendsApi = {
  listFriends: () => apiClient.get<FriendResponse[]>("/friends"),
  addFriend: (username: string) => apiClient.post<FriendResponse>("/friends", { username }),
  removeFriend: (username: string) => apiClient.delete<null>(`/friends/${encodeURIComponent(username)}`),
};
