export type SplitReceiptItem = {
  id: string;
  name: string;
  total_price: number;
  tax_code: string | null;
};

export type SplitRequest = {
  receipt: {
    store_name: string | null;
    purchase_date: string | null;
    items: SplitReceiptItem[];
    tax: number | null;
    tip: number | null;
    receipt_image_id: string | null;
  };
  assignments: Record<string, string[]>;
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
};

export type SavedSplit = {
  id: string;
  payer: string;
  people: PersonSplit[];
  total: number;
  tax_note: string | null;
  store_name: string | null;
  purchase_date: string | null;
  receipt_image_id: string | null;
  created_at: string;
  emailed_usernames: string[];
};
