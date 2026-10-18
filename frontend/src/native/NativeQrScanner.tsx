import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type NativeQrScannerProps = {
  isVisible: boolean;
  onScanned: (scannedText: string) => void;
  onCancel: () => void;
};

const SCANNER_GREEN = "#2a6100";

export default function NativeQrScanner({ isVisible, onScanned, onCancel }: NativeQrScannerProps) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const hasScannedRef = useRef(false);

  useEffect(() => {
    if (!isVisible) {
      return;
    }
    hasScannedRef.current = false;
    if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) {
      requestCameraPermission();
    }
  }, [isVisible, cameraPermission, requestCameraPermission]);

  function handleScanned(scanResult: BarcodeScanningResult) {
    if (hasScannedRef.current) {
      return;
    }
    hasScannedRef.current = true;
    onScanned(scanResult.data);
  }

  const isAllowed = cameraPermission?.granted === true;

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onCancel}>
      <View style={styles.screen}>
        {isAllowed ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={handleScanned}
          />
        ) : (
          <Text style={styles.message}>
            {cameraPermission && !cameraPermission.canAskAgain
              ? "Camera access is off. Turn it on for this app in Settings to scan QR codes."
              : "Allow camera access to scan a friend's QR code."}
          </Text>
        )}
        <View style={styles.target} pointerEvents="none" />
        <Text style={styles.hint}>Point the camera at a friend's groSharey QR code</Text>
        <Pressable style={styles.cancelButton} onPress={onCancel} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
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
  target: {
    position: "absolute",
    width: 240,
    height: 240,
    borderWidth: 4,
    borderColor: "#ffffff",
    borderRadius: 16,
    borderStyle: "dashed",
  },
  hint: {
    position: "absolute",
    top: 80,
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  cancelButton: {
    position: "absolute",
    bottom: 60,
    backgroundColor: SCANNER_GREEN,
    borderRadius: 10,
    paddingHorizontal: 36,
    paddingVertical: 14,
  },
  cancelText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
});
