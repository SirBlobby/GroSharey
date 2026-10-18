import { useEffect, useState } from 'react';
import type { Friend } from '../types';
import Avatar from './Avatar';
import '../styles/modal.css';

interface Props {
  title: string;
  friends: Friend[];
  /** true = multi-select list with Done; false = "add friend" only */
  selectable: boolean;
  initialSelected?: number[];
  onAddFriend: (name: string) => Friend;
  onDone?: (selectedIds: number[]) => void;
  onClose: () => void;
}

export default function FriendModal({
  title, friends, selectable, initialSelected = [], onAddFriend, onDone, onClose,
}: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set(initialSelected));
  const [newName, setNewName] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    const friend = onAddFriend(name);
    if (selectable) setSelected((prev) => new Set(prev).add(friend.id));
    setNewName('');
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card modal" role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>

        {selectable &&
          friends.map((f) => {
            const on = selected.has(f.id);
            return (
              <button key={f.id} type="button" className={`opt ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => toggle(f.id)}>
                <Avatar friend={f} />
                {f.name}
                <span className="chk">{on ? '✓' : ''}</span>
              </button>
            );
          })}

        <div className="newf">
          <input
            value={newName}
            placeholder="New friend's name"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <button type="button" className="btn" onClick={add}>Add</button>
        </div>

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
