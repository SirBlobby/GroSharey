import { useEffect, useState } from "react";

import { insightsApi } from "../api/insightsApi";
import { PriceWatch } from "../types/insights";
import { readErrorMessage } from "../utils";

export function usePriceWatch() {
  const [priceWatch, setPriceWatch] = useState<PriceWatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCurrentRequest = true;
    insightsApi
      .getPriceWatch()
      .then((loadedPriceWatch) => {
        if (isCurrentRequest) setPriceWatch(loadedPriceWatch);
      })
      .catch((error: unknown) => {
        if (isCurrentRequest) setErrorMessage(readErrorMessage(error, "Couldn't load price watch"));
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoading(false);
      });
    return () => {
      isCurrentRequest = false;
    };
  }, []);

  return { priceWatch, isLoading, errorMessage };
}
