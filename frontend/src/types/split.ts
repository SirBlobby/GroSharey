export type SplitReceiptItem = {
  id: string;
  name: string;
  total_price: number;
  tax_code: string | null;
};

export type SplitRequest = {
  receipt: {
    store_name: string | null;
    store_address: string | null;
    purchase_date: string | null;
    items: SplitReceiptItem[];
    tax: number | null;
    tip: number | null;
    receipt_image_id: string | null;
  };
  assignments: Record<string, string[]>;
  payer_username: string | null;
  paid_in_full: string[];
  paid_amounts: Record<string, number>;
  group_id: string | null;
  shopping_list_matches: Record<string, string[]> | null;
};

export type ItemShare = {
  item_id: string;
  name: string;
  price: number;
  tax: number;
  total: number;
};

export type PersonSplit = {
  username: string;
  items: ItemShare[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  owes: number;
  paid: number;
};

export type DisputeStatus = "open" | "dismissed" | "removed";

export type ItemDispute = {
  id: string;
  item_id: string;
  item_name: string;
  username: string;
  reason: string | null;
  status: DisputeStatus;
  created_at: string;
  resolved_by: string | null;
  resolved_at: string | null;
};

export type SavedSplit = {
  id: string;
  payer: string;
  people: PersonSplit[];
  total: number;
  tax_note: string | null;
  store_name: string | null;
  store_address: string | null;
  purchase_date: string | null;
  receipt_image_id: string | null;
  group_id: string | null;
  group_name: string | null;
  created_by: string | null;
  created_at: string;
  disputes: ItemDispute[];
  emailed_usernames: string[];
  crossed_off_items: string[];
};
