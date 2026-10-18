import { useCallback, useEffect, useState } from "react";

import { groupsApi } from "../api/groupsApi";
import { Group, GroupRequest } from "../types/group";
import { readErrorMessage } from "../utils";

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshGroups = useCallback(async () => {
    try {
      setGroups(await groupsApi.listGroups());
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Couldn't load your groups"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshGroups();
  }, [refreshGroups]);

  async function createGroup(groupRequest: GroupRequest): Promise<Group> {
    const createdGroup = await groupsApi.createGroup(groupRequest);
    setGroups((currentGroups) => [createdGroup, ...currentGroups]);
    return createdGroup;
  }

  async function updateGroup(groupId: string, groupRequest: GroupRequest): Promise<Group> {
    const updatedGroup = await groupsApi.updateGroup(groupId, groupRequest);
    setGroups((currentGroups) => currentGroups.map((group) => (group.id === groupId ? updatedGroup : group)));
    return updatedGroup;
  }

  async function deleteGroup(groupId: string): Promise<void> {
    await groupsApi.deleteGroup(groupId);
    setGroups((currentGroups) => currentGroups.filter((group) => group.id !== groupId));
  }

  async function leaveGroup(groupId: string): Promise<void> {
    await groupsApi.leaveGroup(groupId);
    setGroups((currentGroups) => currentGroups.filter((group) => group.id !== groupId));
  }

  return { groups, isLoading, errorMessage, refreshGroups, createGroup, updateGroup, deleteGroup, leaveGroup };
}

export type GroupList = ReturnType<typeof useGroups>;
