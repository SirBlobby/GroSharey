import { useState } from 'react';
import type { Friend, Item } from '../types';
import { money, uid } from '../utils';
import Avatar from '../components/Avatar';
import FriendModal from '../components/FriendModal';
import ItemRow from '../components/ItemRow';
import '../styles/manage.css';

interface Props {
  items: Item[];
  onItemsChange: (items: Item[]) => void;
  friends: Friend[];
  onAddFriend: (name: string) => Friend;
  onBack: () => void;
  onConfirm: () => void;
}

export default function ManageItemsScreen({
  items, onItemsChange, friends, onAddFriend, onBack, onConfirm,
}: Props) {
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [focusId, setFocusId] = useState<number | null>(null);

  const patch = (id: number, p: Partial<Item>) =>
    onItemsChange(items.map((i) => (i.id === id ? { ...i, ...p } : i)));

  const addItem = () => {
    const item: Item = { id: uid(), name: '', price: '', friendIds: [] };
    setFocusId(item.id);
    onItemsChange([...items, item]);
  };

  const total = items.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0);
  const assigning = items.find((i) => i.id === assigningId);

  return (
    <section className="screen">
      <div className="title-top">Assign Friends</div>

      <div className="manage-body">
        <div className="card items">
          <h2>Items</h2>
          <div className="item-rows">
            {items.length === 0 ? (
              <div className="empty">No items yet.<br />Tap + to add one.</div>
            ) : (
              items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  autoFocus={item.id === focusId}
                  onChange={(p) => patch(item.id, p)}
                  onDelete={() => onItemsChange(items.filter((i) => i.id !== item.id))}
                />
              ))
            )}
          </div>
          <button type="button" className="plus" aria-label="Add item" onClick={addItem}>+</button>
          {items.length > 0 && <div className="total">Total: {money(total)}</div>}
        </div>

        <div className="assign">
          <div className="spacer" />
          {items.map((item) => (
            <div key={item.id} className="arow">
              {item.friendIds.map((fid) => {
                const f = friends.find((x) => x.id === fid);
                return f ? (
                  <Avatar
                    key={fid}
                    friend={f}
                    title={`Remove ${f.name}`}
                    onClick={() => patch(item.id, { friendIds: item.friendIds.filter((x) => x !== fid) })}
                  />
                ) : null;
              })}
              <button type="button" className="plus" aria-label="Assign friends" onClick={() => setAssigningId(item.id)}>+</button>
            </div>
          ))}
        </div>
      </div>

      <div className="footer">
        <button type="button" className="btn" onClick={onBack}>Back</button>
        <button type="button" className="btn" onClick={onConfirm}>Confirm</button>
      </div>

      {assigning && (
        <FriendModal
          title="Who shares this item?"
          friends={friends}
          selectable
          initialSelected={assigning.friendIds}
          onAddFriend={onAddFriend}
          onDone={(ids) => { patch(assigning.id, { friendIds: ids }); setAssigningId(null); }}
          onClose={() => setAssigningId(null)}
        />
      )}
    </section>
  );
}
