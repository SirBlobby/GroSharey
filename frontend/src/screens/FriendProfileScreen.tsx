import BalanceCard from "../components/BalanceCard";
import { BackIcon } from "../components/icons";
import FriendProfileCard from "../components/profile/FriendProfileCard";
import SharedSplits from "../components/profile/SharedSplits";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import type { Friend } from "../types";
import "../styles/main.css";
import "../styles/account.css";
import "../styles/history.css";
import "../styles/friendProfile.css";

type FriendProfileScreenProps = {
  username: string;
  friends: Friend[];
  people: Friend[];
  onAddFriend: (username: string) => Promise<Friend>;
  onRemoveFriend: (username: string) => Promise<void>;
  onSettleUp: (friend: Friend, amount: number) => Promise<void>;
  onBack: () => void;
};

export default function FriendProfileScreen({
  username,
  friends,
  people,
  onAddFriend,
  onRemoveFriend,
  onSettleUp,
  onBack,
}: FriendProfileScreenProps) {
  const { currentUser } = useAuth();
  const { profile, isLoading, errorMessage } = useProfile(username);

  const friend = friends.find((knownFriend) => knownFriend.username === profile?.username);
  const isOwnProfile = currentUser?.username === profile?.username;

  return (
    <section className="screen friend-profile">
      <div className="topbar">
        <span>Profile</span>
        <button type="button" onClick={onBack}>
          <BackIcon /> Back
        </button>
      </div>

      {isLoading && <p className="friend-profile-message">Loading profile...</p>}
      {errorMessage && <p className="friend-profile-message">{errorMessage}</p>}

      {profile && currentUser && (
        <div className="friend-profile-layout">
          <FriendProfileCard
            profile={profile}
            friend={friend}
            isOwnProfile={isOwnProfile}
            onAddFriend={onAddFriend}
            onRemoveFriend={onRemoveFriend}
          />

          <div className="friend-profile-details">
            {friend && <BalanceCard friend={friend} onSettleUp={onSettleUp} />}
            {friend && (
              <SharedSplits
                friendUsername={friend.username}
                friendName={friend.name}
                currentUsername={currentUser.username}
                people={people}
              />
            )}
            {!friend && !isOwnProfile && (
              <div className="card friend-profile-invite">
                <h2>Split groceries together</h2>
                <p className="description">
                  Add {profile.display_name} as a friend to assign them items, track who owes what, and settle up.
                </p>
              </div>
            )}
            {isOwnProfile && (
              <div className="card friend-profile-invite">
                <h2>This is your profile</h2>
                <p className="description">This is what your friends see when they open your link or QR code.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
