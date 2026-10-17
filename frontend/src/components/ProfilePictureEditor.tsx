import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { profilesApi } from "../api/profilesApi";
import { useAuth } from "../hooks/useAuth";
import { useFormSubmission } from "../hooks/useFormSubmission";
import { CropRegion } from "../media/cropMath";
import { cropImageToBase64, PickedImage, pickImageFromLibrary } from "../media/imageProcessing";
import { spacing } from "../theme/spacing";
import ErrorMessage from "./ErrorMessage";
import ImageCropper from "./ImageCropper";
import PrimaryButton from "./PrimaryButton";
import ProfilePicture from "./ProfilePicture";

export default function ProfilePictureEditor() {
  const { currentUser, updateCurrentUser } = useAuth();
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

  if (!currentUser) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ProfilePicture profile={currentUser} size={120} />
      <PrimaryButton label="Change Profile Picture" onPress={choosePicture} />
      {!pickedImage && errorMessage && <ErrorMessage message={errorMessage} />}
      {pickedImage && (
        <ImageCropper
          key={pickedImage.uri}
          image={pickedImage}
          isSaving={isSubmitting}
          errorMessage={errorMessage}
          onCancel={cancelCrop}
          onConfirm={submit}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.small,
  },
});
