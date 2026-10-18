import { PublicProfile } from "./profile";

export type ShoppingListItem = {
  id: string;
  name: string;
  quantity: string | null;
  store: string | null;
  notes: string | null;
  requested_by: string;
  is_crossed_off: boolean;
  crossed_off_by: string | null;
  crossed_off_at: string | null;
  bought_at: string | null;
  created_at: string;
};

export type ShoppingList = {
  id: string;
  name: string;
  owner_username: string;
  group_id: string | null;
  group_name: string | null;
  members: PublicProfile[];
  items: ShoppingListItem[];
  created_at: string;
};

export type NewShoppingList = {
  name: string;
  group_id: string | null;
};

export type NewShoppingListItem = {
  name: string;
  quantity: string | null;
  store: string | null;
  notes: string | null;
  requested_by: string | null;
};
