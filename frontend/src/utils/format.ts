export function money(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatPrice(value: string): string {
  const parsedPrice = parseFloat(value.replace(/[^0-9.]/g, ""));
  return isNaN(parsedPrice) ? "" : parsedPrice.toFixed(2);
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function readErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}
