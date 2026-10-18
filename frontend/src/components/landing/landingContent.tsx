import { ReactNode } from "react";

import {
  AuditLogIcon,
  BellAlertIcon,
  EqualSplitIcon,
  FriendsIcon,
  HistoryIcon,
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
    title: "Scan the receipt",
    description: "Snap a photo and groSharey reads every item, discount, and tax marker for you. Or type items in yourself.",
  },
  {
    title: "Assign who shares what",
    description: "Tap roommates onto each item, split everything equally, and pick who paid at the store.",
  },
  {
    title: "Settle up",
    description: "Everyone sees exactly what they owe. Pay with one tap on Venmo or PayPal, in full or a little at a time.",
  },
];

export const LANDING_FEATURES: LandingFeature[] = [
  {
    icon: <ViewReceiptIcon />,
    title: "Smart receipt scanning",
    description: "AI reads store receipts, expands abbreviations, and flags totals that don't add up.",
  },
  {
    icon: <EqualSplitIcon />,
    title: "Penny-exact splits",
    description: "Tax lands only on taxed items and leftover cents are shared fairly, so every split adds up.",
  },
  {
    icon: <FriendsIcon />,
    title: "Add roommates by QR code",
    description: "Share your code or link and your roommates are one tap away from splitting with you.",
  },
  {
    icon: <WalletIcon />,
    title: "Balances that explain themselves",
    description: "See who owes whom at a glance, record partial payments, and keep credit when someone overpays.",
  },
  {
    icon: <HistoryIcon />,
    title: "History with receipts",
    description: "Every grocery run is saved with its receipt photo, so you can always check what was bought.",
  },
  {
    icon: <BellAlertIcon />,
    title: "Notifications",
    description: "Get notified and emailed when a roommate adds you to a split or pays you back.",
  },
  {
    icon: <AuditLogIcon />,
    title: "Audit log",
    description: "A full record of everything that happened on your account, from log ins to payments.",
  },
];
