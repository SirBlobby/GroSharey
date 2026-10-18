import { groupsApi } from "../api/groupsApi";
import type { Item } from "../types";
import { Group } from "../types/group";
import { buildItemsKey, SplitGroup } from "./splits";

export type GroupMatchResult = {
  items: Item[];
  splitGroup: SplitGroup;
};

function buildEmptySplitGroup(group: Group): SplitGroup {
  return {
    groupId: group.id,
    groupName: group.name,
    shoppingListName: null,
    shoppingListMatches: null,
    matchedItemsKey: "",
    matchedItemCount: 0,
  };
}

export async function matchGroupItems(group: Group, items: Item[]): Promise<GroupMatchResult> {
  const namedItems = items.filter((item) => item.name.trim().length > 0);
  if (namedItems.length === 0) {
    return { items, splitGroup: buildEmptySplitGroup(group) };
  }
  const groupItemMatches = await groupsApi.matchItems(
    group.id,
    namedItems.map((item) => ({ id: item.id, name: item.name.trim() })),
  );

  const matchedItems = items.map((item) => {
    const matchedUsernames = groupItemMatches.assignments[item.id] ?? [];
    return matchedUsernames.length > 0
      ? { ...item, usernames: [...new Set([...item.usernames, ...matchedUsernames])] }
      : item;
  });

  return {
    items: matchedItems,
    splitGroup: {
      groupId: group.id,
      groupName: group.name,
      shoppingListName: groupItemMatches.shopping_list_name,
      shoppingListMatches: groupItemMatches.matches,
      matchedItemsKey: buildItemsKey(items),
      matchedItemCount: Object.keys(groupItemMatches.assignments).length,
    },
  };
}
