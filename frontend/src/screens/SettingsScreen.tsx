import { BackIcon } from "../components/icons";
import AccountSettings from "../components/settings/AccountSettings";
import AppearanceSettings from "../components/settings/AppearanceSettings";
import AppInfoSettings from "../components/settings/AppInfoSettings";
import AuditLogSettings from "../components/settings/AuditLogSettings";
import FriendManager from "../components/settings/FriendManager";
import ProfileSettings from "../components/settings/ProfileSettings";
import SettingsMenu from "../components/settings/SettingsMenu";
import { SettingsSection } from "../components/settings/settingsSections";
import type { Friend } from "../types";
import "../styles/main.css";
import "../styles/account.css";
import "../styles/settings.css";

type SettingsScreenProps = {
  activeSection: SettingsSection;
  onSelectSection: (section: SettingsSection) => void;
  friends: Friend[];
  onAddFriend: (username: string) => Promise<Friend>;
  onRemoveFriend: (username: string) => Promise<void>;
  onViewProfile: (username: string) => void;
  onBack: () => void;
};

export default function SettingsScreen({
  activeSection,
  onSelectSection,
  friends,
  onAddFriend,
  onRemoveFriend,
  onViewProfile,
  onBack,
}: SettingsScreenProps) {
  function renderActiveSection() {
    switch (activeSection) {
      case "friends":
        return (
          <FriendManager
            friends={friends}
            onAddFriend={onAddFriend}
            onRemoveFriend={onRemoveFriend}
            onViewProfile={onViewProfile}
          />
        );
      case "appearance":
        return <AppearanceSettings />;
      case "account":
        return <AccountSettings />;
      case "auditLog":
        return <AuditLogSettings />;
      case "appInfo":
        return <AppInfoSettings />;
      default:
        return <ProfileSettings friends={friends} />;
    }
  }

  return (
    <section className="screen account">
      <div className="topbar">
        <span>Settings</span>
        <button type="button" onClick={onBack}>
          <BackIcon /> <span className="topbar-label">Back to Home</span>
        </button>
      </div>

      <div className="settings-layout">
        <SettingsMenu activeSection={activeSection} onSelectSection={onSelectSection} />
        {renderActiveSection()}
      </div>
    </section>
  );
}
