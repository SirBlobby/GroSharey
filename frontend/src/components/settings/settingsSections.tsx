import { ReactNode } from "react";

import { AccountIcon, AppearanceIcon, AppInfoIcon, AuditLogIcon, FriendsIcon, HistoryIcon, ProfileIcon } from "../icons";

export type SettingsSection = "profile" | "friends" | "history" | "appearance" | "account" | "auditLog" | "appInfo";

export const SETTINGS_SECTIONS: { id: SettingsSection; label: string; icon: ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <ProfileIcon /> },
  { id: "friends", label: "Friends", icon: <FriendsIcon /> },
  { id: "history", label: "History", icon: <HistoryIcon /> },
  { id: "appearance", label: "Appearance", icon: <AppearanceIcon /> },
  { id: "account", label: "Account", icon: <AccountIcon /> },
  { id: "auditLog", label: "Audit Log", icon: <AuditLogIcon /> },
  { id: "appInfo", label: "App Info", icon: <AppInfoIcon /> },
];
