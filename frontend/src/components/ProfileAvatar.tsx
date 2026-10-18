import { buildApiUrl } from "../api/apiClient";
import { PublicProfile } from "../types/profile";

type ProfileAvatarProps = {
  profile: PublicProfile;
};

export default function ProfileAvatar({ profile }: ProfileAvatarProps) {
  if (profile.profile_picture_url) {
    return (
      <img
        className="profile-avatar"
        src={buildApiUrl(profile.profile_picture_url)}
        alt={`${profile.display_name} profile picture`}
      />
    );
  }

  return (
    <span className="profile-avatar profile-avatar--initial" aria-hidden="true">
      {profile.display_name.charAt(0).toUpperCase()}
    </span>
  );
}
