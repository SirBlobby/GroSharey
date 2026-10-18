import { useEffect, useRef } from 'react';
import type { ScanStage } from '../types';
import type { ScannedReceipt } from '../services/receipt';
import type { useReceiptScanner } from '../hooks/useReceiptScanner';
import { useDeviceActions } from '../context/DeviceActionsContext';
import { useWebcam } from '../hooks/useWebcam';
import { CameraIcon, UploadIcon } from '../components/icons';
import '../styles/scan.css';

interface Props {
  scanner: ReturnType<typeof useReceiptScanner>;
  onBack: () => void;
  onConfirm: (receipt: ScannedReceipt) => void;
}

function describeStatus(
  scanner: Props['scanner'],
  webcam: ReturnType<typeof useWebcam>,
  hasDeviceCamera: boolean,
): string {
  if (scanner.status === 'reading') return 'Reading receipt...';
  if (scanner.status === 'error') return scanner.errorMessage ?? "Couldn't read the receipt";
  if (scanner.status === 'done') return scanner.scannedReceipt?.storeName ?? 'Receipt read!';
  if (webcam.status === 'starting') return 'Starting camera...';
  if (hasDeviceCamera) return 'Tap the shutter to open the camera';
  if (webcam.status === 'unavailable') return webcam.errorMessage ?? '';
  return '';
}

export default function ScanReceiptScreen({ scanner, onBack, onConfirm }: Props) {
  const stage: ScanStage = scanner.status === 'done' ? 'review' : 'live';
  const isReading = scanner.status === 'reading';
  const hasDeviceCamera = Boolean(useDeviceActions().captureReceiptImage);
  const isShowingPhoto = Boolean(scanner.imageUri) && (isReading || stage === 'review');
  const webcam = useWebcam(!hasDeviceCamera && !isShowingPhoto);
  const isShowingWebcam = webcam.status === 'starting' || webcam.status === 'ready';
  const hasOpenedDeviceCameraRef = useRef(false);

  useEffect(() => {
    if (hasDeviceCamera && !hasOpenedDeviceCameraRef.current && scanner.status === 'idle') {
      hasOpenedDeviceCameraRef.current = true;
      scanner.scan('camera');
    }
  }, [hasDeviceCamera, scanner]);

  function takePhoto() {
    const capturedFrame = webcam.captureFrame();
    if (capturedFrame) {
      scanner.readImage(capturedFrame);
    } else {
      scanner.scan('camera');
    }
  }

  return (
    <section className="screen">
      <div className="title-top">Scan Receipt</div>

      <div className="card scan-card">
        <div className="frame">
          {isShowingPhoto && scanner.imageUri && (
            <img className="receipt-preview" src={scanner.imageUri} alt="Receipt" />
          )}
          {!isShowingPhoto && (
            <video
              ref={webcam.videoRef}
              className={`camera-preview ${isShowingWebcam ? '' : 'camera-preview--hidden'}`}
              autoPlay
              playsInline
              muted
            />
          )}
          {!isShowingPhoto && !isShowingWebcam && <CameraIcon />}
          <div className="lbl">{describeStatus(scanner, webcam, hasDeviceCamera)}</div>
        </div>
      </div>

      {stage === 'live' ? (
        <div className="actions actions--camera">
          <button type="button" className="btn" onClick={onBack} disabled={isReading}>Back</button>
          <button
            type="button"
            className="shutter"
            aria-label="Take photo"
            disabled={isReading || webcam.status === 'starting'}
            onClick={takePhoto}
          />
          <button type="button" className="btn" onClick={() => scanner.scan('library')} disabled={isReading}><UploadIcon /> Upload</button>
        </div>
      ) : (
        <div className="actions">
          <button type="button" className="btn" onClick={scanner.reset}>Retake</button>
          <button
            type="button"
            className="btn"
            onClick={() => scanner.scannedReceipt && onConfirm(scanner.scannedReceipt)}
          >
            Confirm
          </button>
        </div>
      )}
    </section>
  );
}
