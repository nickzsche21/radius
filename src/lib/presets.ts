import type { Copy } from "./places";

/**
 * The setups people actually have.
 *
 * The first three are not strawmen — they are the arrangements described in the
 * thread this came from, including the one everybody believes is 3-2-1 and is
 * not.
 */
export interface Preset {
  id: string;
  name: string;
  blurb: string;
  copies: Omit<Copy, "uid">[];
}

export const PRESETS: Preset[] = [
  {
    id: "multi-az",
    name: "Multi-AZ",
    blurb: "Two availability zones in one region, which the console calls highly available.",
    copies: [
      { placeId: "aws-us-east-1", zone: "us-east-1a", account: "prod", immutable: false, label: "primary" },
      { placeId: "aws-us-east-1", zone: "us-east-1b", account: "prod", immutable: false, label: "standby" },
    ],
  },
  {
    id: "believed-321",
    name: "The 3-2-1 you think you have",
    blurb: "Laptop, a drive on the desk, and the cloud folder that syncs both. Three copies, one room, one login.",
    copies: [
      { placeId: "self-home", account: "you@example.com", immutable: false, label: "laptop" },
      { placeId: "self-home", account: "you@example.com", immutable: false, label: "external drive" },
      { placeId: "aws-ap-south-1", account: "you@example.com", immutable: false, label: "cloud sync" },
    ],
  },
  {
    id: "two-region",
    name: "Two regions, one account",
    blurb: "Continents apart and genuinely safe from weather. Still one key away from nothing.",
    copies: [
      { placeId: "aws-us-east-1", account: "root", immutable: false, label: "primary" },
      { placeId: "aws-eu-central-1", account: "root", immutable: false, label: "replica" },
    ],
  },
  {
    id: "actually",
    name: "Actually separated",
    blurb: "Three providers, three credentials, three continents, and one copy nothing online can touch.",
    copies: [
      { placeId: "aws-us-east-1", account: "aws-prod", immutable: false, label: "primary" },
      { placeId: "gcp-europe-west1", account: "gcp-backup", immutable: false, label: "offsite" },
      { placeId: "az-centralindia", account: "azure-cold", immutable: false, label: "cold" },
      { placeId: "self-drawer", account: "nobody", immutable: true, label: "offline drive" },
    ],
  },
];

let n = 0;
export const withUids = (p: Preset): Copy[] => p.copies.map((c) => ({ ...c, uid: `c${++n}` }));
