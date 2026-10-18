import { useEffect } from 'react';
import '../styles/confirmed.css';

interface Props {
  crossedOffItems?: string[];
  onDone: () => void;
  /** ms before returning to the main view */
  duration?: number;
}

const CROSSED_OFF_EXTRA_DURATION = 1800;

export default function ConfirmedScreen({ crossedOffItems = [], onDone, duration = 2600 }: Props) {
  const displayDuration = crossedOffItems.length > 0 ? duration + CROSSED_OFF_EXTRA_DURATION : duration;

  useEffect(() => {
    const t = setTimeout(onDone, displayDuration);
    return () => clearTimeout(t);
  }, [onDone, displayDuration]);

  return (
    <section className="screen confirmed">
      <h1>Your groceries<br />were logged!</h1>
      <svg viewBox="0 0 120 120" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
        <path className="ring" d="M60 3a57 57 0 1 0 57 57" />
        <path className="tick" d="M38 62l19 19 46-46" />
      </svg>
      {crossedOffItems.length > 0 && (
        <p className="confirmed-crossed-off">Crossed off the shopping list: {crossedOffItems.join(", ")}</p>
      )}
    </section>
  );
}
