import { ReactNode } from "react";

import { AccountIcon, AppearanceIcon, AppInfoIcon, FriendsIcon, ProfileIcon } from "../icons";

export type SettingsSection = "profile" | "friends" | "appearance" | "account" | "appInfo";

export const SETTINGS_SECTIONS: { id: SettingsSection; label: string; icon: ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <ProfileIcon /> },
  { id: "friends", label: "Friends", icon: <FriendsIcon /> },
  { id: "appearance", label: "Appearance", icon: <AppearanceIcon /> },
  { id: "account", label: "Account", icon: <AccountIcon /> },
  { id: "appInfo", label: "App Info", icon: <AppInfoIcon /> },
];
