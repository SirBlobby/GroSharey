import type { Friend } from "../types";
import { SavedSplit } from "../types/split";
import { money } from "../utils";

export type UnpaidAmounts = Map<string, Map<string, number>>;

export type SplitStanding = {
  label: string;
  className: string;
};

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function allocateOutstanding(
  newestFirstSplits: SavedSplit[],
  debtorUsername: string,
  outstandingCents: number,
  unpaidAmounts: UnpaidAmounts,
): void {
  let remainingCents = Math.max(outstandingCents, 0);
  for (const split of newestFirstSplits) {
    const debtorShare = split.people.find((person) => person.username === debtorUsername);
    if (!debtorShare || debtorShare.owes <= 0) {
      continue;
    }
    const unpaidCents = Math.min(toCents(debtorShare.owes), remainingCents);
    remainingCents -= unpaidCents;
    const unpaidForSplit = unpaidAmounts.get(split.id) ?? new Map<string, number>();
    unpaidForSplit.set(debtorUsername, unpaidCents);
    unpaidAmounts.set(split.id, unpaidForSplit);
  }
}

export function calculateUnpaidAmounts(
  splits: SavedSplit[],
  currentUsername: string,
  people: Friend[],
): UnpaidAmounts {
  const unpaidAmounts: UnpaidAmounts = new Map();
  const newestFirstSplits = [...splits].sort((first, second) => second.created_at.localeCompare(first.created_at));

  for (const person of people) {
    if (person.username === currentUsername) {
      continue;
    }
    const balanceCents = toCents(person.balance);
    const splitsPersonPaid = newestFirstSplits.filter((split) => split.payer === person.username);
    const splitsYouPaid = newestFirstSplits.filter((split) => split.payer === currentUsername);
    allocateOutstanding(splitsPersonPaid, currentUsername, -balanceCents, unpaidAmounts);
    allocateOutstanding(splitsYouPaid, person.username, balanceCents, unpaidAmounts);
  }
  return unpaidAmounts;
}

function readUnpaidCents(split: SavedSplit, username: string, unpaidForSplit: Map<string, number>): number {
  if (unpaidForSplit.has(username)) {
    return unpaidForSplit.get(username) ?? 0;
  }
  const share = split.people.find((person) => person.username === username);
  return share ? Math.max(toCents(share.owes), 0) : 0;
}

function isInSplit(split: SavedSplit, username: string): boolean {
  return split.people.some((person) => person.username === username);
}

function describeWithFriend(
  split: SavedSplit,
  currentUsername: string,
  friendUsername: string,
  unpaidForSplit: Map<string, number>,
): SplitStanding {
  if (split.payer === friendUsername && isInSplit(split, currentUsername)) {
    const unpaidCents = readUnpaidCents(split, currentUsername, unpaidForSplit);
    return unpaidCents > 0
      ? { label: `You owe @${friendUsername} ${money(unpaidCents / 100)}`, className: "history-owe" }
      : { label: `You paid @${friendUsername} back`, className: "history-settled" };
  }
  if (split.payer === currentUsername && isInSplit(split, friendUsername)) {
    const unpaidCents = readUnpaidCents(split, friendUsername, unpaidForSplit);
    return unpaidCents > 0
      ? { label: `@${friendUsername} owes you ${money(unpaidCents / 100)}`, className: "history-owed" }
      : { label: `@${friendUsername} paid you back`, className: "history-settled" };
  }
  return { label: `Paid by @${split.payer}`, className: "history-neutral" };
}

function describeForYou(
  split: SavedSplit,
  currentUsername: string,
  unpaidForSplit: Map<string, number>,
): SplitStanding {
  if (split.payer === currentUsername) {
    const unpaidCents = split.people
      .filter((person) => person.username !== currentUsername)
      .reduce((total, person) => total + readUnpaidCents(split, person.username, unpaidForSplit), 0);
    return unpaidCents > 0
      ? { label: `You paid, owed ${money(unpaidCents / 100)}`, className: "history-owed" }
      : { label: "You paid, everyone paid you back", className: "history-settled" };
  }
  const unpaidCents = readUnpaidCents(split, currentUsername, unpaidForSplit);
  return unpaidCents > 0
    ? { label: `You owe @${split.payer} ${money(unpaidCents / 100)}`, className: "history-owe" }
    : { label: `You paid @${split.payer} back`, className: "history-settled" };
}

export function describeSplitStanding(
  split: SavedSplit,
  currentUsername: string,
  unpaidForSplit: Map<string, number>,
  focusUsername?: string,
): SplitStanding {
  return focusUsername
    ? describeWithFriend(split, currentUsername, focusUsername, unpaidForSplit)
    : describeForYou(split, currentUsername, unpaidForSplit);
}
