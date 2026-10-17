function normalizeBaseUrl(rawUrl: string): string {
  return rawUrl.replace(/\/+$/, "").replace(/\/api$/, "");
}

export const apiBaseUrl: string = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000");
