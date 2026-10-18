import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

// Receipts are tall and narrow; 2000px on the long edge keeps small print readable
// while staying well under the backend's 3 MB upload limit.
const MAX_RECEIPT_LONG_EDGE = 2000;
const RECEIPT_JPEG_QUALITY = 0.8;

export type ReceiptImageSource = "camera" | "library";

export type ReceiptImage = {
  uri: string;
  base64: string;
};

async function launchPicker(source: ReceiptImageSource): Promise<ImagePicker.ImagePickerResult> {
  const pickerOptions: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 1 };
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Camera permission is required to scan a receipt");
    }
    return ImagePicker.launchCameraAsync(pickerOptions);
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library permission is required to choose a receipt");
  }
  return ImagePicker.launchImageLibraryAsync(pickerOptions);
}

/** Takes or picks a receipt photo, then shrinks it and converts it to JPEG for upload. */
export async function captureReceiptImage(source: ReceiptImageSource): Promise<ReceiptImage | null> {
  const pickerResult = await launchPicker(source);
  if (pickerResult.canceled) {
    return null;
  }

  const { uri, width, height } = pickerResult.assets[0];
  const manipulatorContext = ImageManipulator.manipulate(uri);
  if (Math.max(width, height) > MAX_RECEIPT_LONG_EDGE) {
    manipulatorContext.resize(
      width >= height ? { width: MAX_RECEIPT_LONG_EDGE } : { height: MAX_RECEIPT_LONG_EDGE },
    );
  }

  const renderedImage = await manipulatorContext.renderAsync();
  const savedImage = await renderedImage.saveAsync({
    format: SaveFormat.JPEG,
    compress: RECEIPT_JPEG_QUALITY,
    base64: true,
  });
  if (!savedImage.base64) {
    throw new Error("Could not read the receipt photo");
  }
  return { uri: savedImage.uri, base64: savedImage.base64 };
}
