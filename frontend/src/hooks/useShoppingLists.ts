import { useCallback, useEffect, useState } from "react";

import { shoppingListsApi } from "../api/shoppingListsApi";
import { NewShoppingList, NewShoppingListItem, ShoppingList } from "../types/shoppingList";
import { readErrorMessage } from "../utils";

export function useShoppingLists(initialListId: string | null) {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(initialListId);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshShoppingLists = useCallback(async () => {
    try {
      const loadedLists = await shoppingListsApi.listShoppingLists();
      setShoppingLists(loadedLists);
      setSelectedListId((currentListId) =>
        loadedLists.some((shoppingList) => shoppingList.id === currentListId)
          ? currentListId
          : (loadedLists[0]?.id ?? null),
      );
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Couldn't load your shopping lists"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshShoppingLists();
  }, [refreshShoppingLists]);

  function replaceList(updatedList: ShoppingList) {
    setShoppingLists((currentLists) =>
      currentLists.map((shoppingList) => (shoppingList.id === updatedList.id ? updatedList : shoppingList)),
    );
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
      replaceList(await shoppingListsApi.addItem(listId, newItem));
    }, "Couldn't add that item");
  }

  function setItemCrossedOff(listId: string, itemId: string, isCrossedOff: boolean) {
    return runListAction(async () => {
      replaceList(await shoppingListsApi.setItemCrossedOff(listId, itemId, isCrossedOff));
    }, "Couldn't update that item");
  }

  function removeItem(listId: string, itemId: string) {
    return runListAction(async () => {
      replaceList(await shoppingListsApi.removeItem(listId, itemId));
    }, "Couldn't remove that item");
  }

  const selectedList = shoppingLists.find((shoppingList) => shoppingList.id === selectedListId);

  return {
    shoppingLists,
    selectedList,
    isLoading,
    errorMessage,
    selectList: setSelectedListId,
    refreshShoppingLists,
    createList,
    deleteList,
    addItem,
    setItemCrossedOff,
    removeItem,
  };
}

export type ShoppingListCenter = ReturnType<typeof useShoppingLists>;
