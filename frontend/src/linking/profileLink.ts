import { appBaseUrl } from "../config/environment";

export const sharedUsernameParameter = "user";

export function buildProfileLink(username: string): string {
  return `${appBaseUrl}/?${sharedUsernameParameter}=${encodeURIComponent(username)}`;
}

const USERNAME_PATTERN = /^@?([a-z0-9_]{3,30})$/i;

export function readUsernameFromProfileLink(scannedText: string): string | null {
  const trimmedText = scannedText.trim();
  try {
    const sharedUsername = new URL(trimmedText).searchParams.get(sharedUsernameParameter);
    if (sharedUsername) {
      return sharedUsername.toLowerCase();
    }
  } catch {
    return USERNAME_PATTERN.exec(trimmedText)?.[1].toLowerCase() ?? null;
  }
  return null;
}
