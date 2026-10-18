import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { captureReceiptImageForWebView } from "./src/media/receiptImage";
import WebApp from "./src/WebApp";

const APP_BACKGROUND_COLOR = "#47a152";

const DOM_HOST_FALLBACK_SCRIPT = [
  `window.$$EXPO_DOM_HOST_OS = window.$$EXPO_DOM_HOST_OS || ${JSON.stringify(Platform.OS)};`,
  "window.$$EXPO_INITIAL_PROPS = window.$$EXPO_INITIAL_PROPS || { names: [], props: {} };",
  "true;",
].join("\n");

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <WebApp
          captureReceiptImage={Platform.OS === "web" ? undefined : captureReceiptImageForWebView}
          dom={{
            useExpoDOMWebView: false,
            injectedJavaScriptBeforeContentLoaded: DOM_HOST_FALLBACK_SCRIPT,
            style: styles.webApp,
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_BACKGROUND_COLOR,
  },
  webApp: {
    flex: 1,
    backgroundColor: APP_BACKGROUND_COLOR,
  },
});
