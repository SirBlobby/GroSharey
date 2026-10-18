import type { Friend } from "../types";
import Avatar from "./Avatar";
import { ProfileIcon } from "./icons";

type FriendOverviewHeaderProps = {
  friend: Friend;
  onViewProfile: (username: string) => void;
};

export default function FriendOverviewHeader({ friend, onViewProfile }: FriendOverviewHeaderProps) {
  return (
    <div className="friend-overview">
      <Avatar friend={friend} />
      <div className="friend-overview-names">
        <span className="friend-overview-name">{friend.name}</span>
        <span className="handle">@{friend.username}</span>
        <button type="button" className="friend-overview-link" onClick={() => onViewProfile(friend.username)}>
          <ProfileIcon /> Full profile
        </button>
      </div>
    </div>
  );
}
