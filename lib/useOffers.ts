"use client";

import { useEffect, useState } from "react";
import type { OffersMap } from "./types";
import { loadOffers } from "./offersClient";

export function useOffers(): OffersMap {
  const [offers, setOffers] = useState<OffersMap>({});
  useEffect(() => {
    let mounted = true;
    loadOffers().then((o) => {
      if (mounted) setOffers(o);
    });
    return () => {
      mounted = false;
    };
  }, []);
  return offers;
}
