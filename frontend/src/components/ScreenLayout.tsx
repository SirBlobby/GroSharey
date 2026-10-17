import { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type ScreenLayoutProps = {
  title: string;
  children: ReactNode;
};

export default function ScreenLayout({ title, children }: ScreenLayoutProps) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title} role="heading" aria-level={1}>
          {title}
        </Text>
        {children}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
});
