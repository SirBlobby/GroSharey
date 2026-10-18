const accessTokenKey = "access_token";

export async function getAccessToken(): Promise<string | null> {
  return window.localStorage.getItem(accessTokenKey);
}

export async function saveAccessToken(accessToken: string): Promise<void> {
  window.localStorage.setItem(accessTokenKey, accessToken);
}

export async function removeAccessToken(): Promise<void> {
  window.localStorage.removeItem(accessTokenKey);
}
