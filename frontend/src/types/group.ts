import { PublicProfile } from "./profile";

export type ShoppingTrip = {
  shopper_username: string;
  store: string;
  started_at: string;
};

export type Group = {
  id: string;
  name: string;
  owner_username: string;
  members: PublicProfile[];
  shopping_list_id: string | null;
  active_trip: ShoppingTrip | null;
  monthly_budget: number | null;
  month_spent: number;
  created_at: string;
};

export type GroupRequest = {
  name: string;
  member_usernames: string[];
  monthly_budget: number | null;
};

export type GroupItemMatches = {
  shopping_list_id: string | null;
  shopping_list_name: string | null;
  assignments: Record<string, string[]>;
  matches: Record<string, string[]>;
};
