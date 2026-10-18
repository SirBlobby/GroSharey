import { Group, GroupItemMatches, GroupRequest } from "../types/group";
import { apiClient } from "./apiClient";

export const groupsApi = {
  listGroups: () => apiClient.get<Group[]>("/groups"),
  createGroup: (groupRequest: GroupRequest) => apiClient.post<Group>("/groups", groupRequest),
  updateGroup: (groupId: string, groupRequest: GroupRequest) =>
    apiClient.put<Group>(`/groups/${groupId}`, groupRequest),
  deleteGroup: (groupId: string) => apiClient.delete<null>(`/groups/${groupId}`),
  leaveGroup: (groupId: string) => apiClient.post<null>(`/groups/${groupId}/leave`, {}),
  matchItems: (groupId: string, items: { id: string; name: string }[]) =>
    apiClient.post<GroupItemMatches>(`/groups/${groupId}/match-items`, { items }),
};
