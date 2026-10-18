export type PriceComparison = {
  product: string;
  cheapest_store: string;
  cheapest_price: number;
  cheapest_date: string;
  latest_store: string;
  latest_price: number;
  latest_date: string;
  highest_price: number;
  purchase_count: number;
  store_count: number;
  savings: number;
  tip: string | null;
};

export type PriceWatch = {
  comparisons: PriceComparison[];
  tracked_products: number;
};

export type MemberRecap = {
  name: string;
  username: string;
  share: number;
  runs_paid: number;
  items_bought: number;
  top_product: string | null;
};

export type YearlyRecap = {
  year: number;
  scope_name: string;
  grocery_runs: number;
  items_bought: number;
  total_spent: number;
  your_share: number;
  top_products: { product: string; count: number }[];
  top_stores: { store: string; visits: number; spent: number }[];
  shopping_buddy: { name: string; runs: number } | null;
  biggest_run: { store: string; total: number; date: string } | null;
  members: MemberRecap[];
  headline: string;
};
