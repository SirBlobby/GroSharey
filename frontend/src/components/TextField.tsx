import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";

import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type TextFieldProps = TextInputProps & {
  label: string;
};

export default function TextField({ label, style, ...textInputProps }: TextFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.textSecondary}
        {...textInputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.extraSmall,
  },
  label: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.small,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
});
