import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
};

export default function PrimaryButton({ label, onPress, isDisabled = false, isLoading = false }: PrimaryButtonProps) {
  const isInactive = isDisabled || isLoading;

  return (
    <Pressable
      style={[styles.button, isInactive && styles.buttonInactive]}
      onPress={onPress}
      disabled={isInactive}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.small,
    alignItems: "center",
  },
  buttonInactive: {
    opacity: 0.5,
  },
  label: {
    color: colors.onPrimary,
    fontWeight: "600",
  },
});
