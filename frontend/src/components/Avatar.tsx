import type { Friend } from '../types';
import '../styles/avatar.css';

interface Props {
  friend: Friend;
  title?: string;
  onClick?: () => void;
}

export default function Avatar({ friend, title, onClick }: Props) {
  const label = title ?? friend.name;
  return onClick ? (
    <button type="button" className="av av--button" title={label} aria-label={label} onClick={onClick}>
      {friend.initials}
    </button>
  ) : (
    <span className="av" title={label}>{friend.initials}</span>
  );
}
