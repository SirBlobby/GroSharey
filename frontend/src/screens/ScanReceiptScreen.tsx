import type { ScanStage } from '../types';
import { CameraIcon } from '../components/icons';
import '../styles/scan.css';

interface Props {
  stage: ScanStage;
  onStageChange: (stage: ScanStage) => void;
  onBack: () => void;
  onConfirm: () => void;
}

/**
 * One screen, two stages. The camera preview / captured image area is a
 * placeholder owned by the receipt-scanning teammate.
 */
export default function ScanReceiptScreen({ stage, onStageChange, onBack, onConfirm }: Props) {
  return (
    <section className="screen">
      <div className="title-top">Scan Receipt</div>

      <div className="card scan-card">
        <div className="frame">
          <CameraIcon />
          <div className="lbl">{stage === 'review' ? '(still frame)' : ''}</div>
        </div>
      </div>

      {stage === 'live' ? (
        <div className="actions">
          <button type="button" className="btn" onClick={onBack}>Back</button>
          <button type="button" className="shutter" aria-label="Take photo" onClick={() => onStageChange('review')} />
        </div>
      ) : (
        <div className="actions">
          <button type="button" className="btn" onClick={() => onStageChange('live')}>Cancel</button>
          <button type="button" className="btn" onClick={onConfirm}>Confirm</button>
        </div>
      )}
    </section>
  );
}
