import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import NativeQrScanner from "./src/native/NativeQrScanner";
import NativeReceiptCamera from "./src/native/NativeReceiptCamera";
import { useNativeCameras } from "./src/native/useNativeCameras";
import WebApp from "./src/WebApp";

const DEFAULT_PAGE_COLOR = "#25a18e";

const DOM_HOST_FALLBACK_SCRIPT = [
  `window.$$EXPO_DOM_HOST_OS = window.$$EXPO_DOM_HOST_OS || ${JSON.stringify(Platform.OS)};`,
  "window.$$EXPO_INITIAL_PROPS = window.$$EXPO_INITIAL_PROPS || { names: [], props: {} };",
  "true;",
].join("\n");

function MobileApp() {
  const [pageColor, setPageColor] = useState(DEFAULT_PAGE_COLOR);
  const updatePageColor = useCallback((nextPageColor: string) => setPageColor(nextPageColor), []);
  const pageBackground = { backgroundColor: pageColor };
  const nativeCameras = useNativeCameras();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, pageBackground]} edges={["top", "bottom"]}>
        <WebApp
          captureReceiptImage={nativeCameras.captureReceiptImage}
          scanQrCode={nativeCameras.scanQrCode}
          onPageColorChange={updatePageColor}
          dom={{
            useExpoDOMWebView: false,
            injectedJavaScriptBeforeContentLoaded: DOM_HOST_FALLBACK_SCRIPT,
            style: [styles.webApp, pageBackground],
            mediaCapturePermissionGrantType: "grant",
            allowsInlineMediaPlayback: true,
            bounces: false,
            overScrollMode: "never",
          }}
        />
        <NativeReceiptCamera
          isVisible={nativeCameras.isReceiptCameraOpen}
          onPhotoTaken={nativeCameras.acceptPhoto}
          onCancel={nativeCameras.cancelReceipt}
        />
        <NativeQrScanner
          isVisible={nativeCameras.isQrScannerOpen}
          onScanned={nativeCameras.finishQrScan}
          onCancel={() => nativeCameras.finishQrScan(null)}
        />
        <StatusBar style="light" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default function App() {
  if (Platform.OS === "web") {
    return <WebApp />;
  }
  return <MobileApp />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webApp: {
    flex: 1,
  },
});
