export type Point = {
  x: number;
  y: number;
};

export type ImageSize = {
  width: number;
  height: number;
};

export type CropRegion = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function calculateDisplayScale(imageSize: ImageSize, frameSize: number, zoom: number): number {
  return (frameSize / Math.min(imageSize.width, imageSize.height)) * zoom;
}

export function clampOffset(offset: Point, imageSize: ImageSize, frameSize: number, displayScale: number): Point {
  return {
    x: clamp(offset.x, frameSize - imageSize.width * displayScale, 0),
    y: clamp(offset.y, frameSize - imageSize.height * displayScale, 0),
  };
}

export function calculateCenteredOffset(imageSize: ImageSize, frameSize: number, displayScale: number): Point {
  return {
    x: (frameSize - imageSize.width * displayScale) / 2,
    y: (frameSize - imageSize.height * displayScale) / 2,
  };
}

export function zoomAroundFrameCenter(
  offset: Point,
  previousScale: number,
  nextScale: number,
  frameSize: number,
): Point {
  const frameCenter = frameSize / 2;
  return {
    x: frameCenter - ((frameCenter - offset.x) / previousScale) * nextScale,
    y: frameCenter - ((frameCenter - offset.y) / previousScale) * nextScale,
  };
}

export function calculateCropRegion(
  offset: Point,
  imageSize: ImageSize,
  frameSize: number,
  displayScale: number,
): CropRegion {
  const cropSize = Math.min(Math.round(frameSize / displayScale), imageSize.width, imageSize.height);
  return {
    originX: clamp(Math.round(-offset.x / displayScale), 0, imageSize.width - cropSize),
    originY: clamp(Math.round(-offset.y / displayScale), 0, imageSize.height - cropSize),
    width: cropSize,
    height: cropSize,
  };
}
