import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import ErrorMessage from "../components/ErrorMessage";
import PrimaryButton from "../components/PrimaryButton";
import ProfilePicture from "../components/ProfilePicture";
import ScreenLayout from "../components/ScreenLayout";
import { useProfile } from "../hooks/useProfile";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type ProfileScreenProps = {
  username: string;
  onBack: () => void;
};

export default function ProfileScreen({ username, onBack }: ProfileScreenProps) {
  const { profile, isLoading, errorMessage } = useProfile(username);

  return (
    <ScreenLayout title={profile ? profile.display_name : "Profile"}>
      {isLoading && <ActivityIndicator color={colors.primary} />}
      {errorMessage && <ErrorMessage message={errorMessage} />}
      {profile && (
        <View style={styles.profileDetails}>
          <ProfilePicture profile={profile} size={120} />
          <Text style={styles.detailText}>@{profile.username}</Text>
          <Text style={styles.detailText}>Account ID: {profile.id}</Text>
        </View>
      )}
      <PrimaryButton label="Back" onPress={onBack} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  profileDetails: {
    gap: spacing.small,
    alignItems: "center",
  },
  detailText: {
    color: colors.textSecondary,
  },
});
