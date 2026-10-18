import { useEffect, useState } from "react";

import { splitsApi } from "../api/splitsApi";
import { SavedSplit } from "../types/split";
import { readErrorMessage } from "../utils";

export function useSplitHistory() {
  const [splits, setSplits] = useState<SavedSplit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCurrentRequest = true;

    splitsApi
      .listSplits()
      .then((loadedSplits) => {
        if (isCurrentRequest) setSplits(loadedSplits);
      })
      .catch((error: unknown) => {
        if (isCurrentRequest) setErrorMessage(readErrorMessage(error, "Couldn't load your split history"));
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoading(false);
      });

    return () => {
      isCurrentRequest = false;
    };
  }, []);

  return { splits, isLoading, errorMessage };
}
