import { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "../theme/colors";
import ScreenLayout from "./ScreenLayout";

type AuthLayoutProps = {
  title: string;
  switchPageLabel: string;
  onSwitchPage: () => void;
  children: ReactNode;
};

export default function AuthLayout({ title, switchPageLabel, onSwitchPage, children }: AuthLayoutProps) {
  return (
    <ScreenLayout title={title}>
      {children}
      <Pressable onPress={onSwitchPage}>
        <Text style={styles.switchPageText}>{switchPageLabel}</Text>
      </Pressable>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  switchPageText: {
    color: colors.primary,
    textAlign: "center",
  },
});
