import { useEffect, useState } from 'react';
import type { Friend } from '../types';
import { readErrorMessage } from '../utils';
import Avatar from './Avatar';
import '../styles/modal.css';

interface Props {
  title: string;
  friends: Friend[];
  /** true = multi-select list with Done; false = "add friend" only */
  selectable: boolean;
  initialSelected?: string[];
  onAddFriend: (username: string) => Promise<Friend>;
  onDone?: (selectedUsernames: string[]) => void;
  onClose: () => void;
}

export default function FriendModal({
  title, friends, selectable, initialSelected = [], onAddFriend, onDone, onClose,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [newUsername, setNewUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = (username: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });

  const add = async () => {
    const username = newUsername.trim().toLowerCase();
    if (!username || isAdding) return;
    setIsAdding(true);
    setErrorMessage(null);
    try {
      const friend = await onAddFriend(username);
      if (selectable) setSelected((prev) => new Set(prev).add(friend.username));
      setNewUsername('');
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Couldn't add that friend"));
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card modal" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>

        {selectable &&
          friends.map((f) => {
            const on = selected.has(f.username);
            return (
              <button key={f.username} type="button" className={`opt ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => toggle(f.username)}>
                <Avatar friend={f} />
                {f.name}
                <span className="chk">{on ? '✓' : ''}</span>
              </button>
            );
          })}

        <div className="newf">
          <input
            value={newUsername}
            placeholder="Friend's username"
            autoCapitalize="none"
            onChange={(e) => setNewUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button type="button" className="btn" onClick={add} disabled={isAdding}>Add</button>
        </div>
        {errorMessage && <p className="error-text">{errorMessage}</p>}

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>{selectable ? 'Cancel' : 'Close'}</button>
          {selectable && (
            <button type="button" className="btn" onClick={() => onDone?.([...selected])}>Done</button>
          )}
        </div>
      </div>
    </div>
  );
}
