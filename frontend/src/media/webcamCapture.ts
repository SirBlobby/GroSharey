import type { ReceiptImage } from "./receiptImage";

const MAX_CAPTURE_LONG_EDGE = 2000;
const CAPTURE_JPEG_QUALITY = 0.85;
const JPEG_DATA_URL_PREFIX = "data:image/jpeg;base64,";

export function captureVideoFrame(video: HTMLVideoElement): ReceiptImage | null {
  const { videoWidth, videoHeight } = video;
  if (videoWidth === 0 || videoHeight === 0) {
    return null;
  }

  const scale = Math.min(1, MAX_CAPTURE_LONG_EDGE / Math.max(videoWidth, videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(videoWidth * scale);
  canvas.height = Math.round(videoHeight * scale);
  const canvasContext = canvas.getContext("2d");
  if (!canvasContext) {
    return null;
  }
  canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL("image/jpeg", CAPTURE_JPEG_QUALITY);
  return { uri: dataUrl, base64: dataUrl.slice(JPEG_DATA_URL_PREFIX.length) };
}
