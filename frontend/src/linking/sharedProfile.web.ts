import { sharedUsernameParameter } from "./profileLink";

export function readSharedUsername(): string | null {
  return new URLSearchParams(window.location.search).get(sharedUsernameParameter);
}

export function clearSharedUsername(): void {
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete(sharedUsernameParameter);
  window.history.replaceState(null, "", currentUrl.toString());
}
