import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type AuthLayoutProps = {
  title: string;
  switchPageLabel: string;
  onSwitchPage: () => void;
  children: ReactNode;
};

export default function AuthLayout({ title, switchPageLabel, onSwitchPage, children }: AuthLayoutProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title} role="heading" aria-level={1}>
          {title}
        </Text>
        {children}
        <Pressable onPress={onSwitchPage}>
          <Text style={styles.switchPageText}>{switchPageLabel}</Text>
        </Pressable>
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
  switchPageText: {
    color: colors.primary,
    textAlign: "center",
  },
});
