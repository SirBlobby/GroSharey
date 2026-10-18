import { useEffect, useState } from "react";

import { insightsApi } from "../api/insightsApi";
import { YearlyRecap } from "../types/insights";
import { readErrorMessage } from "../utils";

export function useYearlyRecap(year: number, groupId: string | null) {
  const [recap, setRecap] = useState<YearlyRecap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCurrentRequest = true;
    setIsLoading(true);
    setErrorMessage(null);
    insightsApi
      .getRecap(year, groupId)
      .then((loadedRecap) => {
        if (isCurrentRequest) setRecap(loadedRecap);
      })
      .catch((error: unknown) => {
        if (isCurrentRequest) setErrorMessage(readErrorMessage(error, "Couldn't load your recap"));
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoading(false);
      });
    return () => {
      isCurrentRequest = false;
    };
  }, [year, groupId]);

  return { recap, isLoading, errorMessage };
}
