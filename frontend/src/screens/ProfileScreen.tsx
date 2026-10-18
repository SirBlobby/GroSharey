import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { friendsApi } from "../api/friendsApi";
import ErrorMessage from "../components/ErrorMessage";
import PrimaryButton from "../components/PrimaryButton";
import ProfilePicture from "../components/ProfilePicture";
import ScreenLayout from "../components/ScreenLayout";
import { useAuth } from "../hooks/useAuth";
import { useFormSubmission } from "../hooks/useFormSubmission";
import { useProfile } from "../hooks/useProfile";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

type ProfileScreenProps = {
  username: string;
  onBack: () => void;
};

export default function ProfileScreen({ username, onBack }: ProfileScreenProps) {
  const { currentUser } = useAuth();
  const { profile, isLoading, errorMessage } = useProfile(username);
  const [isFriendAdded, setIsFriendAdded] = useState(false);
  const addFriendSubmission = useFormSubmission(async (friendUsername: string) => {
    await friendsApi.addFriend(friendUsername);
    setIsFriendAdded(true);
  });

  const isOwnProfile = currentUser?.username === profile?.username;

  return (
    <ScreenLayout title={profile ? profile.display_name : "Profile"}>
      {isLoading && <ActivityIndicator color={colors.primary} />}
      {errorMessage && <ErrorMessage message={errorMessage} />}
      {profile && (
        <View style={styles.profileDetails}>
          <ProfilePicture profile={profile} size={120} />
          <Text style={styles.detailText}>@{profile.username}</Text>
        </View>
      )}
      {profile && !isOwnProfile && (
        <PrimaryButton
          label={isFriendAdded ? "Friend Added" : "Add Friend"}
          onPress={() => addFriendSubmission.submit(profile.username)}
          isDisabled={isFriendAdded}
          isLoading={addFriendSubmission.isSubmitting}
        />
      )}
      {addFriendSubmission.errorMessage && <ErrorMessage message={addFriendSubmission.errorMessage} />}
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
