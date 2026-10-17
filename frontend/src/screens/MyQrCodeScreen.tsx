import { StyleSheet, Text } from "react-native";

import PrimaryButton from "../components/PrimaryButton";
import ProfileQrCode from "../components/ProfileQrCode";
import ScreenLayout from "../components/ScreenLayout";
import { useAuth } from "../hooks/useAuth";
import { colors } from "../theme/colors";

type MyQrCodeScreenProps = {
  onBack: () => void;
};

export default function MyQrCodeScreen({ onBack }: MyQrCodeScreenProps) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return null;
  }

  return (
    <ScreenLayout title="My QR Code">
      <Text style={styles.description}>
        Have potential roommates scan this code to open your profile.
      </Text>
      <ProfileQrCode username={currentUser.username} />
      <PrimaryButton label="Back" onPress={onBack} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  description: {
    color: colors.textSecondary,
    textAlign: "center",
  },
});
