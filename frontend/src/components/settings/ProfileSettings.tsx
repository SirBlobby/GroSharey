import { useAuth } from "../../hooks/useAuth";
import { useProfilePictureEditor } from "../../hooks/useProfilePictureEditor";
import type { Friend } from "../../types";
import { money } from "../../utils";
import { ImageIcon } from "../icons";
import ImageCropper from "../ImageCropper";
import ProfileAvatar from "../ProfileAvatar";
import ShareableQrCode from "../ShareableQrCode";

type ProfileSettingsProps = {
  friends: Friend[];
};

function sumBalances(friends: Friend[], isIncluded: (balance: number) => boolean): number {
  return friends
    .map((friend) => friend.balance)
    .filter(isIncluded)
    .reduce((total, balance) => total + Math.abs(balance), 0);
}

export default function ProfileSettings({ friends }: ProfileSettingsProps) {
  const { currentUser } = useAuth();
  const pictureEditor = useProfilePictureEditor();

  if (!currentUser) {
    return null;
  }

  const profileStats = [
    { label: "Friends", value: String(friends.length) },
    { label: "Owed to you", value: money(sumBalances(friends, (balance) => balance > 0)) },
    { label: "You owe", value: money(sumBalances(friends, (balance) => balance < 0)) },
  ];

  return (
    <div className="card settings-panel">
      <h2>Profile</h2>

      <div className="profile-grid">
        <div className="profile-tile">
          <ProfileAvatar profile={currentUser} />
          <span className="profile-tile-name">{currentUser.display_name}</span>
          <span className="handle">@{currentUser.username}</span>
          <button type="button" className="btn" onClick={pictureEditor.choosePicture}>
            <ImageIcon /> Change Picture
          </button>
          {!pictureEditor.pickedImage && pictureEditor.errorMessage && (
            <p className="error-text">{pictureEditor.errorMessage}</p>
          )}
          <dl className="profile-stats">
            {profileStats.map((profileStat) => (
              <div key={profileStat.label} className="profile-stat">
                <dt>{profileStat.label}</dt>
                <dd>{profileStat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="profile-tile">
          <h3>My QR Code</h3>
          <p className="description">Roommates scan this or open the link to add you.</p>
          <ShareableQrCode username={currentUser.username} />
        </div>
      </div>

      {pictureEditor.pickedImage && (
        <ImageCropper
          key={pictureEditor.pickedImage.uri}
          image={pictureEditor.pickedImage}
          isSaving={pictureEditor.isSaving}
          errorMessage={pictureEditor.errorMessage}
          onCancel={pictureEditor.cancelCrop}
          onConfirm={pictureEditor.saveCrop}
        />
      )}
    </div>
  );
}
