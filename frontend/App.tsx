import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { captureReceiptImageForWebView } from "./src/media/receiptImage";
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

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, pageBackground]} edges={["top", "bottom"]}>
        <WebApp
          captureReceiptImage={captureReceiptImageForWebView}
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
