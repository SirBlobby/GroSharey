export type Friend = {
  username: string;
  name: string;
  initials: string;
  profilePictureUrl: string | null;
  balance: number;
  venmoPayUrl: string | null;
  paypalPayUrl: string | null;
};

export type Item = {
  id: string;
  name: string;
  price: string;
  usernames: string[];
  taxCode: string | null;
};

export type ScanStage = "live" | "review";
