import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

export async function shareImageNatively(base64Image: string, fileName: string): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) {
    return false;
  }
  const imageFile = new File(Paths.cache, fileName);
  if (imageFile.exists) {
    imageFile.delete();
  }
  imageFile.create();
  imageFile.write(base64Image, { encoding: "base64" });
  await Sharing.shareAsync(imageFile.uri, { mimeType: "image/png", UTI: "public.png" });
  return true;
}
