import { useEffect, useState } from "react";

import { receiptsApi } from "../api/receiptsApi";
import { readErrorMessage } from "../utils";

export function useReceiptImage(receiptImageId: string) {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCurrentRequest = true;
    setImageDataUrl(null);
    setErrorMessage(null);

    receiptsApi
      .getReceiptImage(receiptImageId)
      .then((receiptImage) => {
        if (isCurrentRequest) setImageDataUrl(receiptImage.image_data_url);
      })
      .catch((error: unknown) => {
        if (isCurrentRequest) setErrorMessage(readErrorMessage(error, "Couldn't load the receipt"));
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [receiptImageId]);

  return { imageDataUrl, errorMessage };
}
