import { StyleSheet, Text, View } from "react-native";

import PrimaryButton from "../components/PrimaryButton";
import { useAuth } from "../hooks/useAuth";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

export default function HomeScreen() {
  const { currentUser, logOut } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title} role="heading" aria-level={1}>
          GroSharey
        </Text>
        <Text style={styles.subtitle}>Signed in as {currentUser?.email}</Text>
        <PrimaryButton label="Log Out" onPress={logOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.large,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    width: "100%",
    maxWidth: 400,
    gap: spacing.medium,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
  },
});
