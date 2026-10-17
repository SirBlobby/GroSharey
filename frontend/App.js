import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";

import HomeScreen from "./src/screens/HomeScreen";
import { colors } from "./src/theme/colors";

export default function App() {
  return (
    <View style={styles.container}>
      <HomeScreen />
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
