import { appBaseUrl } from "../config/environment";

export const sharedUsernameParameter = "user";

export function buildProfileLink(username: string): string {
  return `${appBaseUrl}/?${sharedUsernameParameter}=${encodeURIComponent(username)}`;
}
