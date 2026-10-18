import { useEffect, useRef, useState } from "react";

import type { ReceiptImage } from "../media/receiptImage";
import { captureVideoFrame } from "../media/webcamCapture";

type WebcamStatus = "off" | "starting" | "ready" | "unavailable";

const CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
  audio: false,
};

function describeCameraError(error: unknown): string {
  const errorName = error instanceof DOMException ? error.name : "";
  if (errorName === "NotAllowedError") {
    return "Camera access is blocked. Allow it in your browser, or use Upload.";
  }
  if (errorName === "NotFoundError" || errorName === "OverconstrainedError") {
    return "No camera was found. Use Upload instead.";
  }
  if (errorName === "NotReadableError") {
    return "Your camera is being used by another app. Close it, or use Upload.";
  }
  return "The camera couldn't start. Use Upload instead.";
}

export function useWebcam(isEnabled: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<WebcamStatus>("off");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isEnabled) {
      setStatus("off");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      setErrorMessage("This page can't open the camera. Use Upload instead.");
      return;
    }

    let isCurrentStream = true;
    let cameraStream: MediaStream | null = null;
    setStatus("starting");
    setErrorMessage(null);

    navigator.mediaDevices
      .getUserMedia(CAMERA_CONSTRAINTS)
      .then((mediaStream) => {
        if (!isCurrentStream) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        cameraStream = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => null);
        }
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (isCurrentStream) {
          setStatus("unavailable");
          setErrorMessage(describeCameraError(error));
        }
      });

    return () => {
      isCurrentStream = false;
      cameraStream?.getTracks().forEach((track) => track.stop());
    };
  }, [isEnabled]);

  function captureFrame(): ReceiptImage | null {
    return videoRef.current && status === "ready" ? captureVideoFrame(videoRef.current) : null;
  }

  return { videoRef, status, errorMessage, captureFrame };
}
