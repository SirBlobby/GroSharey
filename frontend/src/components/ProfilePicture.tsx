import { Image, StyleSheet, Text, View } from "react-native";

import { buildApiUrl } from "../api/apiClient";
import { colors } from "../theme/colors";
import { PublicProfile } from "../types/profile";

type ProfilePictureProps = {
  profile: PublicProfile;
  size: number;
};

export default function ProfilePicture({ profile, size }: ProfilePictureProps) {
  const circleStyle = { width: size, height: size, borderRadius: size / 2 };

  if (profile.profile_picture_url) {
    return (
      <Image
        source={{ uri: buildApiUrl(profile.profile_picture_url) }}
        style={[styles.picture, circleStyle]}
        accessibilityLabel={`${profile.display_name} profile picture`}
      />
    );
  }

  return (
    <View style={[styles.placeholder, circleStyle]}>
      <Text style={[styles.initial, { fontSize: size / 2.5 }]}>
        {profile.display_name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  picture: {
    alignSelf: "center",
    backgroundColor: colors.border,
  },
  placeholder: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  initial: {
    color: colors.onPrimary,
    fontWeight: "700",
  },
});
