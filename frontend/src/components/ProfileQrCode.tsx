import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { buildProfileLink } from "../linking/profileLink";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

const QR_CODE_SIZE = 220;

type ProfileQrCodeProps = {
  username: string;
};

export default function ProfileQrCode({ username }: ProfileQrCodeProps) {
  const profileLink = buildProfileLink(username);

  return (
    <View style={styles.container}>
      <View style={styles.qrCodeBackground}>
        <QRCode value={profileLink} size={QR_CODE_SIZE} />
      </View>
      <Text selectable style={styles.link}>
        {profileLink}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.small,
  },
  qrCodeBackground: {
    padding: spacing.medium,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  link: {
    color: colors.textSecondary,
    textAlign: "center",
  },
});
