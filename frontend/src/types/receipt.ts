export type ParsedReceiptItem = {
  id: string;
  name: string;
  raw_text: string;
  quantity: number;
  unit_price: number | null;
  discount: number;
  total_price: number;
  tax_code: string | null;
  category: string;
};

export type ParsedReceipt = {
  store_name: string | null;
  store_address: string | null;
  purchase_date: string | null;
  purchase_time: string | null;
  currency: string;
  items: ParsedReceiptItem[];
  subtotal: number | null;
  tax: number | null;
  tip: number | null;
  total: number | null;
  payment_method: string | null;
  notes: string | null;
  warnings: string[];
};
