import { apiBaseUrl } from "../config/environment";
import { getAccessToken } from "../storage/tokenStorage";

type ErrorResponseBody = {
  detail?: string;
};

async function buildRequestHeaders(): Promise<Record<string, string>> {
  const requestHeaders: Record<string, string> = { "Content-Type": "application/json" };
  const accessToken = await getAccessToken();
  if (accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`;
  }
  return requestHeaders;
}

const REQUEST_TIMEOUT_MILLISECONDS = 60000;

export class NetworkError extends Error {}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const abortController = new AbortController();
  const timeoutTimer = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MILLISECONDS);
  try {
    return await fetch(url, { ...options, signal: abortController.signal });
  } catch {
    throw new NetworkError(`Couldn't reach the server at ${apiBaseUrl}. Check that the backend is running.`);
  } finally {
    clearTimeout(timeoutTimer);
  }
}

async function sendRequest<ResponseType>(path: string, options: RequestInit = {}): Promise<ResponseType> {
  const response = await fetchWithTimeout(`${apiBaseUrl}/api${path}`, {
    headers: await buildRequestHeaders(),
    ...options,
  });

  if (!response.ok) {
    const errorBody: ErrorResponseBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail ?? `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null as ResponseType;
  }

  return response.json() as Promise<ResponseType>;
}

async function downloadFile(path: string): Promise<Blob> {
  const response = await fetchWithTimeout(`${apiBaseUrl}/api${path}`, { headers: await buildRequestHeaders() });
  if (!response.ok) {
    const errorBody: ErrorResponseBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail ?? `Request failed with status ${response.status}`);
  }
  return response.blob();
}

export function buildApiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}

export const apiClient = {
  get: <ResponseType>(path: string) => sendRequest<ResponseType>(path),
  download: (path: string) => downloadFile(path),
  post: <ResponseType>(path: string, body: unknown) =>
    sendRequest<ResponseType>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <ResponseType>(path: string, body: unknown) =>
    sendRequest<ResponseType>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <ResponseType>(path: string, body: unknown) =>
    sendRequest<ResponseType>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <ResponseType>(path: string) => sendRequest<ResponseType>(path, { method: "DELETE" }),
};
