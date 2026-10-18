import { useEffect, useState } from "react";

import { useQrScanner } from "../../hooks/useQrScanner";
import type { Friend } from "../../types";
import { readErrorMessage } from "../../utils";
import { AddFriendIcon, ProfileIcon, ScanQrIcon } from "../icons";
import "../../styles/modal.css";
import "../../styles/qrScanner.css";

type QrFriendScannerProps = {
  friends: Friend[];
  onAddFriend: (username: string) => Promise<Friend>;
  onViewProfile: (username: string) => void;
  onClose: () => void;
};

export default function QrFriendScanner({ friends, onAddFriend, onViewProfile, onClose }: QrFriendScannerProps) {
  const scanner = useQrScanner(onClose);
  const [isAdding, setIsAdding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scannedUsername = scanner.scannedUsername;
  const isAlreadyFriend = friends.some((friend) => friend.username === scannedUsername);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  async function addScannedFriend() {
    if (!scannedUsername) {
      return;
    }
    setIsAdding(true);
    setErrorMessage(null);
    try {
      const addedFriend = await onAddFriend(scannedUsername);
      setStatusMessage(`${addedFriend.name} was added!`);
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Couldn't add that friend"));
    } finally {
      setIsAdding(false);
    }
  }

  function scanAgain() {
    setStatusMessage(null);
    setErrorMessage(null);
    scanner.scanAgain();
  }

  return (
    <div className="overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="card modal qr-scanner" role="dialog" aria-modal="true" aria-label="Scan a friend's QR code">
        <h2>
          <ScanQrIcon /> Scan a QR code
        </h2>

        {scannedUsername === null && scanner.usesDeviceCamera && (
          <>
            <p className="description">Scanning with your camera...</p>
            {scanner.unreadableText && (
              <>
                <p className="error-text">That QR code isn't a groSharey profile.</p>
                <button type="button" className="btn" onClick={scanAgain}>
                  Try again
                </button>
              </>
            )}
          </>
        )}
        {scannedUsername === null && !scanner.usesDeviceCamera && (
          <>
            <p className="description">Point the camera at a friend's groSharey QR code from their profile.</p>
            <div className="qr-scanner-frame">
              <video ref={scanner.videoRef} className="qr-scanner-video" muted playsInline autoPlay />
              <span className="qr-scanner-target" aria-hidden="true" />
            </div>
            {scanner.cameraStatus === "starting" && <p className="description">Starting the camera...</p>}
            {scanner.cameraErrorMessage && <p className="error-text">{scanner.cameraErrorMessage}</p>}
            {scanner.unreadableText && <p className="error-text">That QR code isn't a groSharey profile.</p>}
          </>
        )}
        {scannedUsername !== null && (
          <div className="qr-scanner-result">
            <p className="qr-scanner-username">@{scannedUsername}</p>
            {isAlreadyFriend && !statusMessage && <p className="status-text">You're already friends.</p>}
            {statusMessage && <p className="status-text">{statusMessage}</p>}
            {errorMessage && <p className="error-text">{errorMessage}</p>}
            <div className="modal-actions">
              {!isAlreadyFriend && !statusMessage && (
                <button type="button" className="btn" disabled={isAdding} onClick={addScannedFriend}>
                  <AddFriendIcon /> {isAdding ? "Adding..." : "Add friend"}
                </button>
              )}
              <button type="button" className="btn" onClick={() => onViewProfile(scannedUsername)}>
                <ProfileIcon /> Profile
              </button>
            </div>
          </div>
        )}

        <div className="modal-actions">
          {scannedUsername !== null && (
            <button type="button" className="btn" onClick={scanAgain}>
              Scan another
            </button>
          )}
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
