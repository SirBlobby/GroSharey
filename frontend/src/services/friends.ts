import { friendsApi } from "../api/friendsApi";
import { paymentsApi } from "../api/paymentsApi";
import type { Friend } from "../types";
import { User } from "../types/auth";
import { FriendResponse } from "../types/friend";
import { getInitials } from "../utils";

function convertToFriend(friendResponse: FriendResponse): Friend {
  return {
    username: friendResponse.username,
    name: friendResponse.display_name,
    initials: getInitials(friendResponse.display_name),
    balance: friendResponse.balance,
    venmoPayUrl: friendResponse.venmo_pay_url,
    paypalPayUrl: friendResponse.paypal_pay_url,
  };
}

export function convertUserToFriend(user: User): Friend {
  return {
    username: user.username,
    name: "You",
    initials: getInitials(user.display_name),
    balance: 0,
    venmoPayUrl: null,
    paypalPayUrl: null,
  };
}

export async function loadFriends(): Promise<Friend[]> {
  const friendResponses = await friendsApi.listFriends();
  return friendResponses.map(convertToFriend);
}

export async function addFriendByUsername(username: string): Promise<Friend> {
  return convertToFriend(await friendsApi.addFriend(username));
}

export async function settleBalance(friend: Friend): Promise<void> {
  await paymentsApi.recordPayment({
    friend_username: friend.username,
    amount: Math.abs(friend.balance),
    direction: friend.balance < 0 ? "paid" : "received",
    method: "other",
  });
}
