import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";

export type TakenPhoto = {
  uri: string;
  width: number;
  height: number;
};

type NativeReceiptCameraProps = {
  isVisible: boolean;
  onPhotoTaken: (photo: TakenPhoto) => void;
  onCancel: () => void;
};

const BUTTON_GREEN = "#2a6100";

export default function NativeReceiptCamera({ isVisible, onPhotoTaken, onCancel }: NativeReceiptCameraProps) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setIsCameraReady(false);
      return;
    }
    if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) {
      requestCameraPermission();
    }
  }, [isVisible, cameraPermission, requestCameraPermission]);

  async function takePhoto() {
    if (!cameraRef.current || isTakingPhoto) {
      return;
    }
    setIsTakingPhoto(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (photo) {
        onPhotoTaken({ uri: photo.uri, width: photo.width, height: photo.height });
      }
    } finally {
      setIsTakingPhoto(false);
    }
  }

  const isAllowed = cameraPermission?.granted === true;

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onCancel}>
      <View style={styles.screen}>
        {isAllowed ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            onCameraReady={() => setIsCameraReady(true)}
          />
        ) : (
          <Text style={styles.message}>
            {cameraPermission && !cameraPermission.canAskAgain
              ? "Camera access is off. Turn it on for this app in Settings to scan receipts."
              : "Allow camera access to scan a receipt."}
          </Text>
        )}
        <Text style={styles.hint}>Fit the whole receipt in the frame</Text>
        <View style={styles.controls}>
          <Pressable style={styles.cancelButton} onPress={onCancel} accessibilityRole="button">
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.shutter, (!isCameraReady || isTakingPhoto) && styles.shutterDisabled]}
            onPress={takePhoto}
            disabled={!isCameraReady || isTakingPhoto}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
          >
            {isTakingPhoto && <ActivityIndicator color={BUTTON_GREEN} />}
          </Pressable>
          <View style={styles.controlSpacer} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    color: "#ffffff",
    fontSize: 18,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  hint: {
    position: "absolute",
    top: 70,
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  controls: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  cancelButton: {
    width: 100,
    backgroundColor: BUTTON_GREEN,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#ffffff",
    borderWidth: 6,
    borderColor: BUTTON_GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterDisabled: {
    opacity: 0.5,
  },
  controlSpacer: {
    width: 100,
  },
});
