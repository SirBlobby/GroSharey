import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";

import { CropRegion, ImageSize } from "./cropMath";

const MAX_OUTPUT_DIMENSION = 1024;

export type PickedImage = ImageSize & {
  uri: string;
};

export async function pickImageFromLibrary(): Promise<PickedImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Photo library permission is required to choose a profile picture");
  }

  const pickerResult = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 1,
  });
  if (pickerResult.canceled) {
    return null;
  }

  const selectedAsset = pickerResult.assets[0];
  const imageSize = await readImageSize(selectedAsset.uri, selectedAsset.width, selectedAsset.height);
  return { uri: selectedAsset.uri, ...imageSize };
}

async function readImageSize(imageUri: string, reportedWidth: number, reportedHeight: number): Promise<ImageSize> {
  if (reportedWidth > 0 && reportedHeight > 0) {
    return { width: reportedWidth, height: reportedHeight };
  }
  const { width, height } = await Image.getSize(imageUri);
  return { width, height };
}

export async function cropImageToBase64(imageUri: string, cropRegion: CropRegion): Promise<string> {
  const manipulatorContext = ImageManipulator.manipulate(imageUri).crop(cropRegion);
  if (cropRegion.width > MAX_OUTPUT_DIMENSION) {
    manipulatorContext.resize({ width: MAX_OUTPUT_DIMENSION, height: MAX_OUTPUT_DIMENSION });
  }

  const renderedImage = await manipulatorContext.renderAsync();
  const savedImage = await renderedImage.saveAsync({ format: SaveFormat.PNG, base64: true });
  if (!savedImage.base64) {
    throw new Error("Could not read the cropped image");
  }
  return savedImage.base64;
}
