import type { Item } from "../types";
import type { ReceiptDetails } from "./splits";

export type EstimatedShare = {
  username: string;
  amount: number;
};

export function readItemPrice(item: Item): number {
  return parseFloat(item.price) || 0;
}

export function sumItemPrices(items: Item[]): number {
  return items.reduce((total, item) => total + readItemPrice(item), 0);
}

export function estimateShares(items: Item[], receiptDetails: ReceiptDetails): EstimatedShare[] {
  const subtotal = sumItemPrices(items);
  const extraCharges = (receiptDetails.tax ?? 0) + (receiptDetails.tip ?? 0);
  const extraChargeRate = subtotal > 0 ? extraCharges / subtotal : 0;
  const amountsByUsername = new Map<string, number>();

  for (const item of items) {
    if (item.usernames.length === 0) {
      continue;
    }
    const amountPerPerson = (readItemPrice(item) * (1 + extraChargeRate)) / item.usernames.length;
    for (const username of item.usernames) {
      amountsByUsername.set(username, (amountsByUsername.get(username) ?? 0) + amountPerPerson);
    }
  }

  return [...amountsByUsername.entries()]
    .map(([username, amount]) => ({ username, amount }))
    .sort((first, second) => second.amount - first.amount);
}
