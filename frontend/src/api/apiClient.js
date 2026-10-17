import { apiBaseUrl } from "../config/environment";

async function sendRequest(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail ?? `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const apiClient = {
  get: (path) => sendRequest(path),
  post: (path, body) => sendRequest(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path, body) => sendRequest(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path) => sendRequest(path, { method: "DELETE" }),
};
