import { shoppingListsApi } from "../api/shoppingListsApi";
import { NewShoppingListItem, ShoppingList } from "../types/shoppingList";

const CACHED_LISTS_KEY = "grosharey-shopping-lists";
const QUEUED_CHANGES_KEY = "grosharey-shopping-list-changes";
export const OFFLINE_ITEM_PREFIX = "offline-";

export type QueuedListChange =
  | { kind: "crossOff"; listId: string; itemId: string; isCrossedOff: boolean }
  | { kind: "add"; listId: string; temporaryItemId: string; newItem: NewShoppingListItem };

function readStoredJson<StoredValue>(storageKey: string, fallback: StoredValue): StoredValue {
  try {
    const storedText = localStorage.getItem(storageKey);
    return storedText ? (JSON.parse(storedText) as StoredValue) : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredJson(storageKey: string, value: unknown): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    return;
  }
}

export function readCachedLists(): ShoppingList[] {
  return readStoredJson<ShoppingList[]>(CACHED_LISTS_KEY, []);
}

export function saveCachedLists(shoppingLists: ShoppingList[]): void {
  writeStoredJson(CACHED_LISTS_KEY, shoppingLists);
}

export function readQueuedChanges(): QueuedListChange[] {
  return readStoredJson<QueuedListChange[]>(QUEUED_CHANGES_KEY, []);
}

export function queueChange(change: QueuedListChange): QueuedListChange[] {
  const queuedChanges = [...readQueuedChanges(), change];
  writeStoredJson(QUEUED_CHANGES_KEY, queuedChanges);
  return queuedChanges;
}

function saveQueuedChanges(queuedChanges: QueuedListChange[]): void {
  writeStoredJson(QUEUED_CHANGES_KEY, queuedChanges);
}

export function buildOfflineItemId(): string {
  return `${OFFLINE_ITEM_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function findAddedItemId(listBefore: ShoppingList | undefined, listAfter: ShoppingList): string | undefined {
  const knownItemIds = new Set((listBefore?.items ?? []).map((item) => item.id));
  return listAfter.items.find((item) => !knownItemIds.has(item.id))?.id;
}

export function crossOffLocally(
  shoppingList: ShoppingList,
  itemId: string,
  isCrossedOff: boolean,
  username: string,
): ShoppingList {
  return {
    ...shoppingList,
    items: shoppingList.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            is_crossed_off: isCrossedOff,
            crossed_off_by: isCrossedOff ? username : null,
            crossed_off_at: isCrossedOff ? new Date().toISOString() : null,
            bought_at: null,
          }
        : item,
    ),
  };
}

export function addItemLocally(
  shoppingList: ShoppingList,
  temporaryItemId: string,
  newItem: NewShoppingListItem,
  username: string,
): ShoppingList {
  const offlineItem = {
    id: temporaryItemId,
    name: newItem.name,
    quantity: newItem.quantity,
    store: newItem.store,
    notes: newItem.notes,
    requested_by: newItem.requested_by ?? username,
    is_crossed_off: false,
    crossed_off_by: null,
    crossed_off_at: null,
    bought_at: null,
    created_at: new Date().toISOString(),
  };
  return { ...shoppingList, items: [...shoppingList.items, offlineItem] };
}

export async function sendQueuedChanges(): Promise<void> {
  const realItemIds = new Map<string, string>();
  const listsById = new Map(readCachedLists().map((shoppingList) => [shoppingList.id, shoppingList]));
  let remainingChanges = readQueuedChanges();

  while (remainingChanges.length > 0) {
    const change = remainingChanges[0];
    if (change.kind === "add") {
      const updatedList = await shoppingListsApi.addItem(change.listId, change.newItem);
      const addedItemId = findAddedItemId(listsById.get(change.listId), updatedList);
      if (addedItemId) {
        realItemIds.set(change.temporaryItemId, addedItemId);
      }
      listsById.set(updatedList.id, updatedList);
    } else {
      const itemId = realItemIds.get(change.itemId) ?? change.itemId;
      if (!itemId.startsWith(OFFLINE_ITEM_PREFIX)) {
        const updatedList = await shoppingListsApi.setItemCrossedOff(change.listId, itemId, change.isCrossedOff);
        listsById.set(updatedList.id, updatedList);
      }
    }
    remainingChanges = remainingChanges.slice(1);
    saveQueuedChanges(remainingChanges);
  }
}
