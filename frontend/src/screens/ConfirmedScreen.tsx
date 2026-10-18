import { useEffect } from 'react';
import '../styles/confirmed.css';

interface Props {
  onDone: () => void;
  /** ms before returning to the main view */
  duration?: number;
}

export default function ConfirmedScreen({ onDone, duration = 2600 }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  return (
    <section className="screen confirmed">
      <h1>Your groceries<br />were logged!</h1>
      <svg viewBox="0 0 120 120" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
        <path className="ring" d="M60 3a57 57 0 1 0 57 57" />
        <path className="tick" d="M38 62l19 19 46-46" />
      </svg>
    </section>
  );
}
