import { useState } from "react";
import { StyleSheet, Text } from "react-native";

import PrimaryButton from "../components/PrimaryButton";
import ProfilePictureEditor from "../components/ProfilePictureEditor";
import ScreenLayout from "../components/ScreenLayout";
import TextField from "../components/TextField";
import { useAuth } from "../hooks/useAuth";
import { colors } from "../theme/colors";

type HomeScreenProps = {
  onShowMyQrCode: () => void;
  onFindProfile: (username: string) => void;
};

export default function HomeScreen({ onShowMyQrCode, onFindProfile }: HomeScreenProps) {
  const { currentUser, logOut } = useAuth();
  const [searchUsername, setSearchUsername] = useState("");

  const normalizedSearchUsername = searchUsername.trim().toLowerCase();

  if (!currentUser) {
    return null;
  }

  return (
    <ScreenLayout title={currentUser.display_name}>
      <ProfilePictureEditor />
      <Text style={styles.detailText}>@{currentUser.username}</Text>
      <PrimaryButton label="My QR Code" onPress={onShowMyQrCode} />
      <TextField
        label="Find a roommate by username"
        value={searchUsername}
        onChangeText={setSearchUsername}
        placeholder="username"
        autoCapitalize="none"
      />
      <PrimaryButton
        label="Find"
        onPress={() => onFindProfile(normalizedSearchUsername)}
        isDisabled={normalizedSearchUsername.length === 0}
      />
      <PrimaryButton label="Log Out" onPress={logOut} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  detailText: {
    color: colors.textSecondary,
    textAlign: "center",
  },
});
