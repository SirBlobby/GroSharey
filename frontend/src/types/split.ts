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
  };
  assignments: Record<string, string[]>;
};

export type SavedSplit = {
  id: string;
  payer: string;
  total: number;
  tax_note: string | null;
  emailed_usernames: string[];
};
