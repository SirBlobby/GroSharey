import { User } from "../types/auth";
import { PublicProfile } from "../types/profile";
import { apiClient } from "./apiClient";

export const profilesApi = {
  getProfile: (username: string) => apiClient.get<PublicProfile>(`/profiles/${encodeURIComponent(username)}`),
  uploadProfilePicture: (imageBase64: string) =>
    apiClient.put<User>("/profiles/me/picture", { image_base64: imageBase64 }),
};
