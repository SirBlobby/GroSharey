import { useEffect, useState } from "react";
import QRCode from "react-native-qrcode-svg";

import { buildProfileLink } from "../linking/profileLink";
import { CheckIcon, CopyIcon } from "./icons";

const QR_CODE_SIZE = 220;
const COPIED_MESSAGE_DURATION = 2000;

type ShareableQrCodeProps = {
  username: string;
};

export default function ShareableQrCode({ username }: ShareableQrCodeProps) {
  const profileLink = buildProfileLink(username);
  const [isCopied, setIsCopied] = useState(false);
  const [copyErrorMessage, setCopyErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isCopied) {
      return;
    }
    const resetTimer = setTimeout(() => setIsCopied(false), COPIED_MESSAGE_DURATION);
    return () => clearTimeout(resetTimer);
  }, [isCopied]);

  async function copyLink() {
    setCopyErrorMessage(null);
    try {
      await navigator.clipboard.writeText(profileLink);
      setIsCopied(true);
    } catch {
      setCopyErrorMessage("Couldn't copy, select the link and copy it instead");
    }
  }

  return (
    <div className="shareable-qr-code">
      <div className="qr-code-frame">
        <QRCode value={profileLink} size={QR_CODE_SIZE} />
      </div>
      <div className="copy-link-row">
        <input
          className="copy-link-input"
          readOnly
          value={profileLink}
          aria-label="Profile link"
          onFocus={(event) => event.target.select()}
        />
        <button type="button" className="copy-link-button" onClick={copyLink}>
          {isCopied ? <CheckIcon /> : <CopyIcon />}
          {isCopied ? "Copied" : "Copy"}
        </button>
      </div>
      {copyErrorMessage && <p className="error-text">{copyErrorMessage}</p>}
    </div>
  );
}
