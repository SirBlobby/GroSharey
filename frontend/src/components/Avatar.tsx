import { buildApiUrl } from '../api/apiClient';
import type { Friend } from '../types';
import '../styles/avatar.css';

interface Props {
  friend: Friend;
  title?: string;
  onClick?: () => void;
}

export default function Avatar({ friend, title, onClick }: Props) {
  const label = title ?? friend.name;
  const content = friend.profilePictureUrl ? (
    <img className="av-picture" src={buildApiUrl(friend.profilePictureUrl)} alt="" />
  ) : (
    friend.initials
  );
  return onClick ? (
    <button type="button" className="av av--button" title={label} aria-label={label} onClick={onClick}>
      {content}
    </button>
  ) : (
    <span className="av" title={label}>{content}</span>
  );
}
