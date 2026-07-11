import type { OffersMap } from "./types";

let offersPromise: Promise<OffersMap> | null = null;

export function loadOffers(): Promise<OffersMap> {
  if (!offersPromise) {
    offersPromise = fetch("/api/offers", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .catch(() => ({}));
  }
  return offersPromise;
}
