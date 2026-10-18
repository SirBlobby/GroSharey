import { useState } from "react";

import { profilesApi } from "../api/profilesApi";
import { CropRegion } from "../media/cropMath";
import { cropImageToBase64, PickedImage, pickImageFromLibrary } from "../media/imageProcessing";
import { useAuth } from "./useAuth";
import { useFormSubmission } from "./useFormSubmission";

export function useProfilePictureEditor() {
  const { updateCurrentUser } = useAuth();
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const { errorMessage, isSubmitting, submit, setErrorMessage } = useFormSubmission(uploadCroppedImage);

  async function uploadCroppedImage(cropRegion: CropRegion) {
    if (!pickedImage) {
      return;
    }
    const croppedImageBase64 = await cropImageToBase64(pickedImage.uri, cropRegion);
    updateCurrentUser(await profilesApi.uploadProfilePicture(croppedImageBase64));
    setPickedImage(null);
  }

  async function choosePicture() {
    setErrorMessage(null);
    try {
      setPickedImage(await pickImageFromLibrary());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not open the photo library");
    }
  }

  function cancelCrop() {
    setErrorMessage(null);
    setPickedImage(null);
  }

  return {
    pickedImage,
    errorMessage,
    isSaving: isSubmitting,
    choosePicture,
    cancelCrop,
    saveCrop: submit,
  };
}
