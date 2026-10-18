import { useEffect, useState } from "react";

import { useReceiptImage } from "../hooks/useReceiptImage";
import { CloseIcon, ZoomInIcon, ZoomOutIcon } from "./icons";
import "../styles/modal.css";
import "../styles/receiptViewer.css";

type ReceiptViewerModalProps = {
  receiptImageId: string;
  onClose: () => void;
};

export default function ReceiptViewerModal({ receiptImageId, onClose }: ReceiptViewerModalProps) {
  const { imageDataUrl, errorMessage } = useReceiptImage(receiptImageId);
  const [isZoomedIn, setIsZoomedIn] = useState(false);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="card receipt-viewer" role="dialog" aria-modal="true" aria-label="Receipt">
        <div className="receipt-viewer-header">
          <h2>Receipt</h2>
          <div className="receipt-viewer-actions">
            <button
              type="button"
              className="receipt-viewer-button"
              disabled={!imageDataUrl}
              onClick={() => setIsZoomedIn(!isZoomedIn)}
            >
              {isZoomedIn ? <ZoomOutIcon /> : <ZoomInIcon />}
              {isZoomedIn ? "Fit" : "Zoom"}
            </button>
            <button type="button" className="receipt-viewer-button" aria-label="Close receipt" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
        </div>
        <div className={`receipt-viewer-frame ${isZoomedIn ? "zoomed-in" : ""}`}>
          {!imageDataUrl && !errorMessage && <p className="description">Loading receipt...</p>}
          {errorMessage && <p className="error-text">{errorMessage}</p>}
          {imageDataUrl && <img className="receipt-viewer-image" src={imageDataUrl} alt="Scanned receipt" />}
        </div>
      </div>
    </div>
  );
}
