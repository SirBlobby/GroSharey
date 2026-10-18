import { StyleSheet, View } from "react-native";

import { useAuth } from "../hooks/useAuth";
import { useProfilePictureEditor } from "../hooks/useProfilePictureEditor";
import { spacing } from "../theme/spacing";
import ErrorMessage from "./ErrorMessage";
import ImageCropper from "./ImageCropper";
import PrimaryButton from "./PrimaryButton";
import ProfilePicture from "./ProfilePicture";

export default function ProfilePictureEditor() {
  const { currentUser } = useAuth();
  const { pickedImage, errorMessage, isSaving, choosePicture, cancelCrop, saveCrop } = useProfilePictureEditor();

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
          isSaving={isSaving}
          errorMessage={errorMessage}
          onCancel={cancelCrop}
          onConfirm={saveCrop}
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
