import { NewShoppingList, NewShoppingListItem, ShoppingList } from "../types/shoppingList";
import { apiClient } from "./apiClient";

export const shoppingListsApi = {
  listShoppingLists: () => apiClient.get<ShoppingList[]>("/shopping-lists"),
  createShoppingList: (newList: NewShoppingList) => apiClient.post<ShoppingList>("/shopping-lists", newList),
  deleteShoppingList: (listId: string) => apiClient.delete<null>(`/shopping-lists/${listId}`),
  addItem: (listId: string, newItem: NewShoppingListItem) =>
    apiClient.post<ShoppingList>(`/shopping-lists/${listId}/items`, newItem),
  setItemCrossedOff: (listId: string, itemId: string, isCrossedOff: boolean) =>
    apiClient.patch<ShoppingList>(`/shopping-lists/${listId}/items/${itemId}`, { is_crossed_off: isCrossedOff }),
  removeItem: (listId: string, itemId: string) =>
    apiClient.delete<ShoppingList>(`/shopping-lists/${listId}/items/${itemId}`),
};
