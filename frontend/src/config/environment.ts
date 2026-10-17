function removeTrailingSlashes(rawUrl: string): string {
  return rawUrl.replace(/\/+$/, "");
}

export const apiBaseUrl: string = removeTrailingSlashes(
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000",
).replace(/\/api$/, "");

export const appBaseUrl: string = removeTrailingSlashes(
  process.env.EXPO_PUBLIC_APP_URL ?? "http://localhost:8081",
);
