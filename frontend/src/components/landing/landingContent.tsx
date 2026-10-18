import { ReactNode } from "react";

import {
  AppearanceIcon,
  AuditLogIcon,
  BellAlertIcon,
  CheckIcon,
  DisputeIcon,
  EqualSplitIcon,
  GroupsIcon,
  HistoryIcon,
  MatchItemsIcon,
  MicrophoneIcon,
  PantryIcon,
  PriceTagIcon,
  RecapIcon,
  ReminderIcon,
  ScanQrIcon,
  ShoppingListIcon,
  TripIcon,
  ViewReceiptIcon,
  WalletIcon,
} from "../icons";

export type LandingStep = {
  title: string;
  description: string;
};

export type LandingFeature = {
  icon: ReactNode;
  title: string;
  description: string;
};

export const LANDING_STEPS: LandingStep[] = [
  {
    title: "Make a shared list",
    description: "Start a group with your roommates and add what everyone needs. Each item remembers who asked for it.",
  },
  {
    title: "Scan the receipt",
    description: "Snap a photo and groSharey reads every item, discount, and tax marker. Pick your group and AI assigns each item to whoever asked for it.",
  },
  {
    title: "Settle up",
    description: "Everyone sees exactly what they owe. Pay with one tap on Venmo or PayPal, nudge anyone who forgets, and your roommate confirms they got it.",
  },
];

export const LANDING_FEATURES: LandingFeature[] = [
  {
    icon: <ViewReceiptIcon />,
    title: "Smart receipt scanning",
    description: "AI reads store receipts, expands abbreviations, and flags totals that don't add up.",
  },
  {
    icon: <MatchItemsIcon />,
    title: "AI item matching",
    description: "Add a group to a split and \"GV 2% MLK\" goes to whoever wanted milk. Bought items get crossed off the list.",
  },
  {
    icon: <MicrophoneIcon />,
    title: "Voice assistant",
    description: "Run the whole app by talking. Add items, mark the coffee as low, start a trip, set a budget, or ask who owes what, and groSharey answers out loud.",
  },
  {
    icon: <GroupsIcon />,
    title: "Groups and shared lists",
    description: "One shopping list per group, with stores and notes on each item. Crossed-off items stay as history.",
  },
  {
    icon: <PantryIcon />,
    title: "Shared pantry",
    description: "Bought items land in the pantry. Mark something running low and it goes right back on the list.",
  },
  {
    icon: <TripIcon />,
    title: "Shopping trips",
    description: "Say \"I'm going to Trader Joe's\" and your group gets a heads up to add last-minute items.",
  },
  {
    icon: <WalletIcon />,
    title: "Group budgets",
    description: "Set a monthly grocery budget, watch the progress bar, and get an alert before you go over.",
  },
  {
    icon: <PriceTagIcon />,
    title: "Price Watch",
    description: "AI matches the same item across receipts, so \"eggs were $1.20 cheaper at Aldi\" shows up right on your list.",
  },
  {
    icon: <RecapIcon />,
    title: "Yearly and group recaps",
    description: "Your apartment's year in groceries: the top buy, who paid for the most runs, and each roommate's share, on a card you can share.",
  },
  {
    icon: <EqualSplitIcon />,
    title: "Penny-exact splits",
    description: "Tax lands only on taxed items and leftover cents are shared fairly, so every split adds up.",
  },
  {
    icon: <ReminderIcon />,
    title: "Payment reminders",
    description: "Nudge a roommate who still owes you with one tap. They get a notification and an email with a pay link, at most once a day.",
  },
  {
    icon: <DisputeIcon />,
    title: "Item disputes",
    description: "Didn't get something? Flag it, and whoever made the split can take it off your share.",
  },
  {
    icon: <CheckIcon />,
    title: "Confirmed payments",
    description: "Partial payments and overpaying both work, and nothing counts until the person paid confirms it.",
  },
  {
    icon: <ScanQrIcon />,
    title: "Add roommates by QR code",
    description: "Scan a friend's code right in the app, or share your own link, and you're ready to split.",
  },
  {
    icon: <HistoryIcon />,
    title: "History and PDF reports",
    description: "Every grocery run is saved with its receipt photo. Download a monthly PDF for reimbursements.",
  },
  {
    icon: <BellAlertIcon />,
    title: "Notifications",
    description: "Get notified in the app and by branded email when you're added to a split, someone buys your item, or a roommate pays you back.",
  },
  {
    icon: <ShoppingListIcon />,
    title: "Works offline in the store",
    description: "Bad signal in the aisle? The mobile app keeps your list and syncs what you crossed off later.",
  },
  {
    icon: <AppearanceIcon />,
    title: "Built for everyone",
    description: "Dark mode, high contrast, text sizes, reduce motion, and color blindness friendly colors.",
  },
  {
    icon: <AuditLogIcon />,
    title: "Audit log",
    description: "A full record of everything that happened on your account, from log ins to payments.",
  },
];
