import type { ScanStage } from '../types';
import type { ScannedReceipt } from '../services/receipt';
import type { useReceiptScanner } from '../hooks/useReceiptScanner';
import { CameraIcon, UploadIcon } from '../components/icons';
import '../styles/scan.css';

interface Props {
  scanner: ReturnType<typeof useReceiptScanner>;
  onBack: () => void;
  onConfirm: (receipt: ScannedReceipt) => void;
}

function describeStatus(scanner: Props['scanner']): string {
  if (scanner.status === 'reading') return 'Reading receipt...';
  if (scanner.status === 'error') return scanner.errorMessage ?? "Couldn't read the receipt";
  if (scanner.status === 'done') return scanner.scannedReceipt?.storeName ?? 'Receipt read!';
  return '';
}

export default function ScanReceiptScreen({ scanner, onBack, onConfirm }: Props) {
  const stage: ScanStage = scanner.status === 'done' ? 'review' : 'live';
  const isReading = scanner.status === 'reading';

  return (
    <section className="screen">
      <div className="title-top">Scan Receipt</div>

      <div className="card scan-card">
        <div className="frame">
          {scanner.imageUri ? (
            <img className="receipt-preview" src={scanner.imageUri} alt="Receipt" />
          ) : (
            <CameraIcon />
          )}
          <div className="lbl">{describeStatus(scanner)}</div>
        </div>
      </div>

      {stage === 'live' ? (
        <div className="actions actions--camera">
          <button type="button" className="btn" onClick={onBack} disabled={isReading}>Back</button>
          <button
            type="button"
            className="shutter"
            aria-label="Take photo"
            disabled={isReading}
            onClick={() => scanner.scan('camera')}
          />
          <button type="button" className="btn" onClick={() => scanner.scan('library')} disabled={isReading}><UploadIcon /> Upload</button>
        </div>
      ) : (
        <div className="actions">
          <button type="button" className="btn" onClick={scanner.reset}>Cancel</button>
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
