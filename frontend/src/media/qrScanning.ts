import jsQR from "jsqr";

const MAX_SCAN_LONG_EDGE = 720;

export function readQrCode(video: HTMLVideoElement, canvas: HTMLCanvasElement): string | null {
  const { videoWidth, videoHeight } = video;
  if (videoWidth === 0 || videoHeight === 0) {
    return null;
  }
  const scale = Math.min(1, MAX_SCAN_LONG_EDGE / Math.max(videoWidth, videoHeight));
  canvas.width = Math.round(videoWidth * scale);
  canvas.height = Math.round(videoHeight * scale);
  const canvasContext = canvas.getContext("2d", { willReadFrequently: true });
  if (!canvasContext) {
    return null;
  }
  canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(imageData.data, imageData.width, imageData.height)?.data ?? null;
}
