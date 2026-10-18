import { useCallback, useEffect, useState } from "react";

import { NetworkError } from "../api/apiClient";
import { shoppingListsApi } from "../api/shoppingListsApi";
import { isRunningInMobileApp } from "../config/platform";
import {
  addItemLocally,
  buildOfflineItemId,
  crossOffLocally,
  QueuedListChange,
  queueChange,
  readCachedLists,
  readQueuedChanges,
  saveCachedLists,
  sendQueuedChanges,
} from "../services/offlineShoppingLists";
import { NewShoppingList, NewShoppingListItem, ShoppingList } from "../types/shoppingList";
import { readErrorMessage } from "../utils";

const SYNC_RETRY_MILLISECONDS = 20000;
const CAN_WORK_OFFLINE = isRunningInMobileApp();

function isOfflineError(error: unknown): boolean {
  return CAN_WORK_OFFLINE && error instanceof NetworkError;
}

export function useShoppingLists(initialListId: string | null, currentUsername: string) {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(initialListId);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [waitingChangeCount, setWaitingChangeCount] = useState(() =>
    CAN_WORK_OFFLINE ? readQueuedChanges().length : 0,
  );

  function showLists(loadedLists: ShoppingList[]) {
    setShoppingLists(loadedLists);
    setSelectedListId((currentListId) =>
      loadedLists.some((shoppingList) => shoppingList.id === currentListId)
        ? currentListId
        : (loadedLists[0]?.id ?? null),
    );
  }

  const refreshShoppingLists = useCallback(async () => {
    try {
      if (CAN_WORK_OFFLINE) {
        await sendQueuedChanges();
        setWaitingChangeCount(0);
      }
      showLists(await shoppingListsApi.listShoppingLists());
      setIsOffline(false);
      setErrorMessage(null);
    } catch (error) {
      if (isOfflineError(error)) {
        setIsOffline(true);
        setWaitingChangeCount(readQueuedChanges().length);
        setShoppingLists((currentLists) => (currentLists.length > 0 ? currentLists : readCachedLists()));
        setSelectedListId((currentListId) => currentListId ?? readCachedLists()[0]?.id ?? null);
      } else {
        setErrorMessage(readErrorMessage(error, "Couldn't load your shopping lists"));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshShoppingLists();
    if (!CAN_WORK_OFFLINE) {
      return;
    }
    window.addEventListener("online", refreshShoppingLists);
    return () => window.removeEventListener("online", refreshShoppingLists);
  }, [refreshShoppingLists]);

  useEffect(() => {
    if (waitingChangeCount === 0) {
      return;
    }
    const retryTimer = setInterval(refreshShoppingLists, SYNC_RETRY_MILLISECONDS);
    return () => clearInterval(retryTimer);
  }, [waitingChangeCount, refreshShoppingLists]);

  useEffect(() => {
    if (CAN_WORK_OFFLINE && !isLoading && shoppingLists.length > 0) {
      saveCachedLists(shoppingLists);
    }
  }, [isLoading, shoppingLists]);

  function replaceList(updatedList: ShoppingList) {
    setShoppingLists((currentLists) =>
      currentLists.map((shoppingList) => (shoppingList.id === updatedList.id ? updatedList : shoppingList)),
    );
  }

  function updateListLocally(listId: string, changeList: (shoppingList: ShoppingList) => ShoppingList) {
    setShoppingLists((currentLists) =>
      currentLists.map((shoppingList) => (shoppingList.id === listId ? changeList(shoppingList) : shoppingList)),
    );
  }

  function saveForLater(change: QueuedListChange) {
    setIsOffline(true);
    setWaitingChangeCount(queueChange(change).length);
  }

  async function runListAction(action: () => Promise<void>, fallbackError: string): Promise<boolean> {
    setErrorMessage(null);
    try {
      await action();
      return true;
    } catch (error) {
      setErrorMessage(readErrorMessage(error, fallbackError));
      return false;
    }
  }

  function createList(newList: NewShoppingList) {
    return runListAction(async () => {
      const createdList = await shoppingListsApi.createShoppingList(newList);
      setShoppingLists((currentLists) => [createdList, ...currentLists]);
      setSelectedListId(createdList.id);
    }, "Couldn't create that list");
  }

  function deleteList(listId: string) {
    return runListAction(async () => {
      await shoppingListsApi.deleteShoppingList(listId);
      const remainingLists = shoppingLists.filter((shoppingList) => shoppingList.id !== listId);
      setShoppingLists(remainingLists);
      setSelectedListId(remainingLists[0]?.id ?? null);
    }, "Couldn't delete that list");
  }

  function addItem(listId: string, newItem: NewShoppingListItem) {
    return runListAction(async () => {
      try {
        replaceList(await shoppingListsApi.addItem(listId, newItem));
      } catch (error) {
        if (!isOfflineError(error)) {
          throw error;
        }
        const temporaryItemId = buildOfflineItemId();
        updateListLocally(listId, (shoppingList) =>
          addItemLocally(shoppingList, temporaryItemId, newItem, currentUsername),
        );
        saveForLater({ kind: "add", listId, temporaryItemId, newItem });
      }
    }, "Couldn't add that item");
  }

  function setItemCrossedOff(listId: string, itemId: string, isCrossedOff: boolean) {
    if (CAN_WORK_OFFLINE) {
      updateListLocally(listId, (shoppingList) =>
        crossOffLocally(shoppingList, itemId, isCrossedOff, currentUsername),
      );
    }
    return runListAction(async () => {
      if (CAN_WORK_OFFLINE && (isOffline || waitingChangeCount > 0)) {
        saveForLater({ kind: "crossOff", listId, itemId, isCrossedOff });
        return;
      }
      try {
        replaceList(await shoppingListsApi.setItemCrossedOff(listId, itemId, isCrossedOff));
      } catch (error) {
        if (!isOfflineError(error)) {
          if (CAN_WORK_OFFLINE) {
            refreshShoppingLists();
          }
          throw error;
        }
        saveForLater({ kind: "crossOff", listId, itemId, isCrossedOff });
      }
    }, "Couldn't update that item");
  }

  function removeItem(listId: string, itemId: string) {
    return runListAction(async () => {
      replaceList(await shoppingListsApi.removeItem(listId, itemId));
    }, "Couldn't remove that item");
  }

  function markRunningLow(listId: string, pantryItemId: string) {
    return runListAction(async () => {
      replaceList(await shoppingListsApi.markRunningLow(listId, pantryItemId));
    }, "Couldn't put that back on the list");
  }

  function removePantryItem(listId: string, pantryItemId: string) {
    return runListAction(async () => {
      replaceList(await shoppingListsApi.removePantryItem(listId, pantryItemId));
    }, "Couldn't update the pantry");
  }

  const selectedList = shoppingLists.find((shoppingList) => shoppingList.id === selectedListId);

  return {
    shoppingLists,
    selectedList,
    isLoading,
    errorMessage,
    isOffline,
    waitingChangeCount,
    selectList: setSelectedListId,
    refreshShoppingLists,
    createList,
    deleteList,
    addItem,
    setItemCrossedOff,
    removeItem,
    markRunningLow,
    removePantryItem,
  };
}

export type ShoppingListCenter = ReturnType<typeof useShoppingLists>;
