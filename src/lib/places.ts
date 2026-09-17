/**
 * Where the copies actually are.
 *
 * Cloud providers publish the *city* a region sits in, never the coordinates of
 * the buildings, so these are city-level and the page says so. That is precise
 * enough for the question being asked — whether two copies are 40 km or 4,000 km
 * apart — and pretending to more precision than the provider gives out would be
 * dishonest.
 */
import type { Point } from "./geo";

export type Provider = "aws" | "gcp" | "azure" | "self" | "other";

export interface Place {
  id: string;
  provider: Provider;
  /** Region code as the provider writes it, or a plain description. */
  code: string;
  city: string;
  country: string;
  /** Legal bloc, for the copies that are geographically apart but not legally. */
  jurisdiction: string;
  at: Point;
}

export const PLACES: Place[] = [
  // AWS
  { id: "aws-us-east-1", provider: "aws", code: "us-east-1", city: "Ashburn, Virginia", country: "United States", jurisdiction: "US", at: { lat: 39.04, lon: -77.49 } },
  { id: "aws-us-east-2", provider: "aws", code: "us-east-2", city: "Columbus, Ohio", country: "United States", jurisdiction: "US", at: { lat: 39.96, lon: -83.0 } },
  { id: "aws-us-west-1", provider: "aws", code: "us-west-1", city: "San Jose, California", country: "United States", jurisdiction: "US", at: { lat: 37.35, lon: -121.96 } },
  { id: "aws-us-west-2", provider: "aws", code: "us-west-2", city: "Boardman, Oregon", country: "United States", jurisdiction: "US", at: { lat: 45.84, lon: -119.7 } },
  { id: "aws-eu-west-1", provider: "aws", code: "eu-west-1", city: "Dublin", country: "Ireland", jurisdiction: "EU", at: { lat: 53.35, lon: -6.26 } },
  { id: "aws-eu-west-2", provider: "aws", code: "eu-west-2", city: "London", country: "United Kingdom", jurisdiction: "UK", at: { lat: 51.51, lon: -0.13 } },
  { id: "aws-eu-central-1", provider: "aws", code: "eu-central-1", city: "Frankfurt", country: "Germany", jurisdiction: "EU", at: { lat: 50.11, lon: 8.68 } },
  { id: "aws-ap-south-1", provider: "aws", code: "ap-south-1", city: "Mumbai", country: "India", jurisdiction: "IN", at: { lat: 19.08, lon: 72.88 } },
  { id: "aws-ap-southeast-1", provider: "aws", code: "ap-southeast-1", city: "Singapore", country: "Singapore", jurisdiction: "SG", at: { lat: 1.35, lon: 103.82 } },
  { id: "aws-ap-southeast-2", provider: "aws", code: "ap-southeast-2", city: "Sydney", country: "Australia", jurisdiction: "AU", at: { lat: -33.87, lon: 151.21 } },
  { id: "aws-ap-northeast-1", provider: "aws", code: "ap-northeast-1", city: "Tokyo", country: "Japan", jurisdiction: "JP", at: { lat: 35.68, lon: 139.69 } },
  { id: "aws-sa-east-1", provider: "aws", code: "sa-east-1", city: "São Paulo", country: "Brazil", jurisdiction: "BR", at: { lat: -23.55, lon: -46.63 } },
  { id: "aws-me-central-1", provider: "aws", code: "me-central-1", city: "Dubai", country: "United Arab Emirates", jurisdiction: "AE", at: { lat: 25.2, lon: 55.27 } },
  { id: "aws-me-south-1", provider: "aws", code: "me-south-1", city: "Manama", country: "Bahrain", jurisdiction: "BH", at: { lat: 26.07, lon: 50.56 } },

  // GCP
  { id: "gcp-us-central1", provider: "gcp", code: "us-central1", city: "Council Bluffs, Iowa", country: "United States", jurisdiction: "US", at: { lat: 41.26, lon: -95.86 } },
  { id: "gcp-us-east4", provider: "gcp", code: "us-east4", city: "Ashburn, Virginia", country: "United States", jurisdiction: "US", at: { lat: 39.04, lon: -77.49 } },
  { id: "gcp-europe-west1", provider: "gcp", code: "europe-west1", city: "St. Ghislain", country: "Belgium", jurisdiction: "EU", at: { lat: 50.45, lon: 3.82 } },
  { id: "gcp-europe-west2", provider: "gcp", code: "europe-west2", city: "London", country: "United Kingdom", jurisdiction: "UK", at: { lat: 51.51, lon: -0.13 } },
  { id: "gcp-asia-south1", provider: "gcp", code: "asia-south1", city: "Mumbai", country: "India", jurisdiction: "IN", at: { lat: 19.08, lon: 72.88 } },
  { id: "gcp-asia-southeast1", provider: "gcp", code: "asia-southeast1", city: "Singapore", country: "Singapore", jurisdiction: "SG", at: { lat: 1.35, lon: 103.82 } },

  // Azure
  { id: "az-eastus", provider: "azure", code: "eastus", city: "Boydton, Virginia", country: "United States", jurisdiction: "US", at: { lat: 36.67, lon: -78.39 } },
  { id: "az-westeurope", provider: "azure", code: "westeurope", city: "Amsterdam", country: "Netherlands", jurisdiction: "EU", at: { lat: 52.37, lon: 4.9 } },
  { id: "az-uksouth", provider: "azure", code: "uksouth", city: "London", country: "United Kingdom", jurisdiction: "UK", at: { lat: 51.51, lon: -0.13 } },
  { id: "az-centralindia", provider: "azure", code: "centralindia", city: "Pune", country: "India", jurisdiction: "IN", at: { lat: 18.52, lon: 73.86 } },

  // Places that are not a cloud at all. Their coordinates are whatever the
  // reader sets as "here" — hardcoding a city would put everyone's laptop in
  // somebody else's country, in a tool whose entire output is a distance.
  { id: "self-home", provider: "self", code: "home", city: "Where you are", country: "—", jurisdiction: "local", at: { lat: 0, lon: 0 } },
  { id: "self-office", provider: "self", code: "office", city: "Your office", country: "—", jurisdiction: "local", at: { lat: 0, lon: 0 } },
  { id: "self-drawer", provider: "self", code: "drawer", city: "A drive in a drawer", country: "—", jurisdiction: "local", at: { lat: 0, lon: 0 } },
];

/** Somewhere to anchor the copies you keep yourself. */
export const HOME_CITIES = [
  { id: "mumbai", name: "Mumbai", at: { lat: 19.08, lon: 72.88 } },
  { id: "london", name: "London", at: { lat: 51.51, lon: -0.13 } },
  { id: "newyork", name: "New York", at: { lat: 40.71, lon: -74.01 } },
  { id: "sanfrancisco", name: "San Francisco", at: { lat: 37.77, lon: -122.42 } },
  { id: "berlin", name: "Berlin", at: { lat: 52.52, lon: 13.4 } },
  { id: "singapore", name: "Singapore", at: { lat: 1.35, lon: 103.82 } },
  { id: "saopaulo", name: "São Paulo", at: { lat: -23.55, lon: -46.63 } },
  { id: "sydney", name: "Sydney", at: { lat: -33.87, lon: 151.21 } },
] as const;

export const PROVIDER_NAME: Record<Provider, string> = {
  aws: "AWS", gcp: "Google Cloud", azure: "Azure", self: "Yours", other: "Other",
};

/** A copy of your data, somewhere, held under some set of keys. */
export interface Copy {
  uid: string;
  placeId: string;
  /**
   * Availability zone, where the provider has them. Two copies in one region but
   * different zones are not in the same place — AWS documents zones as up to
   * ~100 km apart — and modelling them as one point would understate the
   * distance and blame a rack fire for something only a regional event reaches.
   */
  zone?: string;
  /** Which credential set can delete it. Copies sharing this share a fate. */
  account: string;
  /** Offline or write-once media cannot be reached by whoever holds the keys. */
  immutable: boolean;
  label: string;
}

export const placeOf = (id: string) => PLACES.find((p) => p.id === id) ?? null;
