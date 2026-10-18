import { BackIcon } from "../components/icons";
import AccountSettings from "../components/settings/AccountSettings";
import AppearanceSettings from "../components/settings/AppearanceSettings";
import AppInfoSettings from "../components/settings/AppInfoSettings";
import AuditLogSettings from "../components/settings/AuditLogSettings";
import FriendManager from "../components/settings/FriendManager";
import GroupManager from "../components/settings/GroupManager";
import HistorySettings from "../components/settings/HistorySettings";
import InsightsSettings from "../components/settings/InsightsSettings";
import ProfileSettings from "../components/settings/ProfileSettings";
import SettingsMenu from "../components/settings/SettingsMenu";
import { SettingsSection } from "../components/settings/settingsSections";
import type { GroupList } from "../hooks/useGroups";
import type { Friend } from "../types";
import "../styles/main.css";
import "../styles/account.css";
import "../styles/settings.css";

type SettingsScreenProps = {
  activeSection: SettingsSection;
  onSelectSection: (section: SettingsSection) => void;
  friends: Friend[];
  people: Friend[];
  onAddFriend: (username: string) => Promise<Friend>;
  onRemoveFriend: (username: string) => Promise<void>;
  groupList: GroupList;
  currentUsername: string;
  onOpenShoppingList: (listId: string | null) => void;
  onViewProfile: (username: string) => void;
  onBack: () => void;
};

export default function SettingsScreen({
  activeSection,
  onSelectSection,
  friends,
  people,
  onAddFriend,
  onRemoveFriend,
  groupList,
  currentUsername,
  onOpenShoppingList,
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
      case "groups":
        return (
          <GroupManager
            groupList={groupList}
            friends={friends}
            currentUsername={currentUsername}
            onOpenShoppingList={onOpenShoppingList}
          />
        );
      case "insights":
        return <InsightsSettings groups={groupList.groups} />;
      case "history":
        return <HistorySettings people={people} />;
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
