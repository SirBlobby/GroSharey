import { useEffect, useRef, useState } from "react";

import { useDeviceActions } from "../context/DeviceActionsContext";
import { readUsernameFromProfileLink } from "../linking/profileLink";
import { readQrCode } from "../media/qrScanning";
import { useWebcam } from "./useWebcam";

const SCAN_INTERVAL_MILLISECONDS = 250;

export function useQrScanner(onCancel: () => void) {
  const { scanQrCode } = useDeviceActions();
  const usesDeviceCamera = Boolean(scanQrCode);
  const [scannedUsername, setScannedUsername] = useState<string | null>(null);
  const [unreadableText, setUnreadableText] = useState<string | null>(null);
  const [deviceScanCount, setDeviceScanCount] = useState(0);
  const webcam = useWebcam(!usesDeviceCamera && scannedUsername === null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanQrCodeRef = useRef(scanQrCode);
  const onCancelRef = useRef(onCancel);
  scanQrCodeRef.current = scanQrCode;
  onCancelRef.current = onCancel;

  function showScannedText(scannedText: string) {
    const username = readUsernameFromProfileLink(scannedText);
    if (username) {
      setScannedUsername(username);
      setUnreadableText(null);
    } else {
      setUnreadableText(scannedText);
    }
  }

  useEffect(() => {
    const startDeviceScan = scanQrCodeRef.current;
    if (!usesDeviceCamera || !startDeviceScan) {
      return;
    }
    let isCurrentScan = true;
    startDeviceScan().then((scannedText) => {
      if (!isCurrentScan) {
        return;
      }
      if (scannedText === null) {
        onCancelRef.current();
      } else {
        showScannedText(scannedText);
      }
    });
    return () => {
      isCurrentScan = false;
    };
  }, [usesDeviceCamera, deviceScanCount]);

  useEffect(() => {
    if (usesDeviceCamera || webcam.status !== "ready" || scannedUsername !== null) {
      return;
    }
    canvasRef.current ??= document.createElement("canvas");
    const scanTimer = setInterval(() => {
      const video = webcam.videoRef.current;
      const scannedText = video && canvasRef.current ? readQrCode(video, canvasRef.current) : null;
      if (scannedText) {
        showScannedText(scannedText);
      }
    }, SCAN_INTERVAL_MILLISECONDS);
    return () => clearInterval(scanTimer);
  }, [usesDeviceCamera, webcam.status, webcam.videoRef, scannedUsername]);

  function scanAgain() {
    setScannedUsername(null);
    setUnreadableText(null);
    if (usesDeviceCamera) {
      setDeviceScanCount((currentCount) => currentCount + 1);
    }
  }

  return {
    usesDeviceCamera,
    videoRef: webcam.videoRef,
    cameraStatus: webcam.status,
    cameraErrorMessage: webcam.errorMessage,
    scannedUsername,
    unreadableText,
    scanAgain,
  };
}
