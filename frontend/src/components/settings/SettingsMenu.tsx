import { useAuth } from "../../hooks/useAuth";
import ProfileAvatar from "../ProfileAvatar";
import { SETTINGS_SECTIONS, SettingsSection } from "./settingsSections";

type SettingsMenuProps = {
  activeSection: SettingsSection;
  onSelectSection: (section: SettingsSection) => void;
};

export default function SettingsMenu({ activeSection, onSelectSection }: SettingsMenuProps) {
  const { currentUser } = useAuth();

  return (
    <nav className="card settings-menu" aria-label="Settings">
      {currentUser && (
        <div className="settings-user">
          <ProfileAvatar profile={currentUser} />
          <div className="settings-user-names">
            <span className="settings-user-name">{currentUser.display_name}</span>
            <span className="handle">@{currentUser.username}</span>
          </div>
        </div>
      )}
      <ul className="settings-menu-list">
        {SETTINGS_SECTIONS.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              className={`settings-menu-item ${section.id === activeSection ? "active" : ""}`}
              aria-current={section.id === activeSection ? "page" : undefined}
              onClick={() => onSelectSection(section.id)}
            >
              {section.icon}
              {section.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
