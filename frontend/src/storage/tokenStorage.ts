import * as SecureStore from "expo-secure-store";

const accessTokenKey = "access_token";

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(accessTokenKey);
}

export async function saveAccessToken(accessToken: string): Promise<void> {
  await SecureStore.setItemAsync(accessTokenKey, accessToken);
}

export async function removeAccessToken(): Promise<void> {
  await SecureStore.deleteItemAsync(accessTokenKey);
}
