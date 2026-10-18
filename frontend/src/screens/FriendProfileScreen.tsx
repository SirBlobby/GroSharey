import { useEffect, useState } from "react";

import { friendsApi } from "../api/friendsApi";
import { AddFriendIcon, BackIcon, CheckIcon } from "../components/icons";
import ProfileAvatar from "../components/ProfileAvatar";
import { useAuth } from "../hooks/useAuth";
import { useFormSubmission } from "../hooks/useFormSubmission";
import { useProfile } from "../hooks/useProfile";
import "../styles/account.css";

type FriendProfileScreenProps = {
  username: string;
  onBack: () => void;
};

export default function FriendProfileScreen({ username, onBack }: FriendProfileScreenProps) {
  const { currentUser } = useAuth();
  const { profile, isLoading, errorMessage } = useProfile(username);
  const [isFriendAdded, setIsFriendAdded] = useState(false);
  const [isCheckingFriendship, setIsCheckingFriendship] = useState(true); // ADDED
  const addFriendSubmission = useFormSubmission(async (friendUsername: string) => {
    await friendsApi.addFriend(friendUsername);
    setIsFriendAdded(true);
  });

  // check if already a friend
  useEffect(() => {
    let cancelled = false;
    setIsFriendAdded(false);
    setIsCheckingFriendship(true);

    friendsApi
      .listFriends()
      .then((friends) => {
        if (!cancelled) {
          setIsFriendAdded(friends.some((friend) => friend.username === username));
        }
      })
      .catch(() => {
        // On failure, fall back to showing "Add Friend"
      })
      .finally(() => {
        if (!cancelled) setIsCheckingFriendship(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  const isOwnProfile = currentUser?.username === profile?.username;

  return (
    <section className="screen account">
      <div className="title-top">Profile</div>

      <div className="card account-card">
        {isLoading && <p className="description">Loading...</p>}
        {errorMessage && <p className="error-text">{errorMessage}</p>}
        {profile && (
          <>
            <ProfileAvatar profile={profile} />
            <h2>{profile.display_name}</h2>
            <p className="handle">@{profile.username}</p>
          </>
        )}
        {profile && !isOwnProfile && (
          <button
            type="button"
            className="btn"
            disabled={isFriendAdded || isCheckingFriendship || addFriendSubmission.isSubmitting} // CHANGED: added isCheckingFriendship
            onClick={() => addFriendSubmission.submit(profile.username)}
          >
            {isFriendAdded ? <CheckIcon /> : <AddFriendIcon />} {isFriendAdded ? "Friend Added!" : "Add Friend"}
          </button>
          
        )}
        {addFriendSubmission.errorMessage && <p className="error-text">{addFriendSubmission.errorMessage}</p>}
      </div>

      <div className="footer">
        <button type="button" className="btn" onClick={onBack}>
          <BackIcon /> Back
        </button>
      </div>
    </section>
  );
}