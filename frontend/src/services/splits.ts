import { splitsApi } from "../api/splitsApi";
import type { Item } from "../types";
import { SavedSplit, SplitRequest } from "../types/split";

export type ReceiptDetails = {
  storeName: string | null;
  storeAddress: string | null;
  purchaseDate: string | null;
  receiptImageId: string | null;
  tax: number | null;
  tip: number | null;
  warnings: string[];
};

export const EMPTY_RECEIPT_DETAILS: ReceiptDetails = {
  storeName: null,
  storeAddress: null,
  purchaseDate: null,
  receiptImageId: null,
  tax: null,
  tip: null,
  warnings: [],
};

export type UpfrontPayment = { kind: "full" } | { kind: "partial"; amount: number };

export type SplitPayment = {
  payerUsername: string | null;
  upfrontPayments: Record<string, UpfrontPayment>;
};

export const EMPTY_SPLIT_PAYMENT: SplitPayment = {
  payerUsername: null,
  upfrontPayments: {},
};

export type SplitGroup = {
  groupId: string;
  groupName: string;
  shoppingListName: string | null;
  shoppingListMatches: Record<string, string[]> | null;
  matchedItemsKey: string;
  matchedItemCount: number;
};

export function buildItemsKey(items: Item[]): string {
  return items.map((item) => `${item.id}:${item.name.trim()}`).join("|");
}

function readShoppingListMatches(splitGroup: SplitGroup | null, items: Item[]): Record<string, string[]> | null {
  if (!splitGroup || splitGroup.matchedItemsKey !== buildItemsKey(items)) {
    return null;
  }
  return splitGroup.shoppingListMatches;
}

export function findItemProblem(items: Item[]): string | null {
  if (items.length === 0) {
    return "Add at least one item";
  }
  if (items.some((item) => item.name.trim().length === 0)) {
    return "Give every item a name";
  }
  if (items.some((item) => isNaN(parseFloat(item.price)))) {
    return "Give every item a price";
  }
  if (items.some((item) => item.usernames.length === 0)) {
    return "Assign someone to every item";
  }
  return null;
}

function buildSplitRequest(
  items: Item[],
  receiptDetails: ReceiptDetails,
  splitPayment: SplitPayment,
  splitGroup: SplitGroup | null,
): SplitRequest {
  const upfrontPayments = Object.entries(splitPayment.upfrontPayments).filter(
    ([username]) => username !== splitPayment.payerUsername,
  );
  return {
    receipt: {
      store_name: receiptDetails.storeName,
      store_address: receiptDetails.storeAddress,
      purchase_date: receiptDetails.purchaseDate,
      tax: receiptDetails.tax,
      tip: receiptDetails.tip,
      receipt_image_id: receiptDetails.receiptImageId,
      items: items.map((item) => ({
        id: item.id,
        name: item.name.trim(),
        total_price: parseFloat(item.price),
        tax_code: item.taxCode,
      })),
    },
    assignments: Object.fromEntries(items.map((item) => [item.id, item.usernames])),
    payer_username: splitPayment.payerUsername,
    paid_in_full: upfrontPayments.filter(([, payment]) => payment.kind === "full").map(([username]) => username),
    paid_amounts: Object.fromEntries(
      upfrontPayments.flatMap(([username, payment]) =>
        payment.kind === "partial" && payment.amount > 0 ? [[username, payment.amount]] : [],
      ),
    ),
    group_id: splitGroup?.groupId ?? null,
    shopping_list_matches: readShoppingListMatches(splitGroup, items),
  };
}

export async function saveSplit(
  items: Item[],
  receiptDetails: ReceiptDetails,
  splitPayment: SplitPayment,
  splitGroup: SplitGroup | null,
): Promise<SavedSplit> {
  return splitsApi.saveSplit(buildSplitRequest(items, receiptDetails, splitPayment, splitGroup));
}
