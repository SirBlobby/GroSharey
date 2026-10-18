import type { Item } from '../types';
import { uid } from '../utils';
import { receiptsApi } from '../api/receiptsApi';

/** An item ready for the Assign Friends screen, keeping the tax letter the split needs. */
export type ScannedItem = Item & { taxCode: string | null };

export interface ScannedReceipt {
  storeName: string | null;
  purchaseDate: string | null;
  items: ScannedItem[];
  tax: number | null;
  tip: number | null;
  total: number | null;
  /** Totals that don't add up; show these so the user checks the items before splitting. */
  warnings: string[];
}

/** Sends a receipt photo (base64 JPEG/PNG) to the backend and returns editable items. */
export async function parseReceipt(imageBase64: string): Promise<ScannedReceipt> {
  const receipt = await receiptsApi.parseReceipt(imageBase64);
  return {
    storeName: receipt.store_name,
    purchaseDate: receipt.purchase_date,
    items: receipt.items.map((item) => ({
      id: uid(),
      name: item.name,
      price: item.total_price.toFixed(2),
      friendIds: [],
      taxCode: item.tax_code,
    })),
    tax: receipt.tax,
    tip: receipt.tip,
    total: receipt.total,
    warnings: receipt.warnings,
  };
}
