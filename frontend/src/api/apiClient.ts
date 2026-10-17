import { apiBaseUrl } from "../config/environment";

type ErrorResponseBody = {
  detail?: string;
};

async function sendRequest<ResponseType>(path: string, options: RequestInit = {}): Promise<ResponseType> {
  const response = await fetch(`${apiBaseUrl}/api${path}`, {
    headers: { "Content-Type": "application/json" },
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

export const apiClient = {
  get: <ResponseType>(path: string) => sendRequest<ResponseType>(path),
  post: <ResponseType>(path: string, body: unknown) =>
    sendRequest<ResponseType>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <ResponseType>(path: string, body: unknown) =>
    sendRequest<ResponseType>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <ResponseType>(path: string) => sendRequest<ResponseType>(path, { method: "DELETE" }),
};
