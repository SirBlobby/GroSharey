import { PriceComparison } from "../types/insights";

function readWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(" ")
    .filter((word) => word.length > 2)
    .map((word) => (word.endsWith("s") ? word.slice(0, -1) : word));
}

export function findPriceComparison(itemName: string, comparisons: PriceComparison[]): PriceComparison | undefined {
  const itemWords = readWords(itemName);
  if (itemWords.length === 0) {
    return undefined;
  }
  return comparisons.find((comparison) => {
    const productWords = new Set(readWords(comparison.product));
    return itemWords.every((word) => productWords.has(word));
  });
}
