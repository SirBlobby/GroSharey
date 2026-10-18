import { PublicProfile } from "./profile";

export type Group = {
  id: string;
  name: string;
  owner_username: string;
  members: PublicProfile[];
  shopping_list_id: string | null;
  created_at: string;
};

export type GroupRequest = {
  name: string;
  member_usernames: string[];
};

export type GroupItemMatches = {
  shopping_list_id: string | null;
  shopping_list_name: string | null;
  assignments: Record<string, string[]>;
  matches: Record<string, string[]>;
};
