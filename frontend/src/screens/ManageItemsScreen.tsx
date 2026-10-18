import { useState } from 'react';
import type { Friend, Item } from '../types';
import type { ReceiptDetails } from '../services/splits';
import { money, uid } from '../utils';
import Avatar from '../components/Avatar';
import FriendModal from '../components/FriendModal';
import ItemRow from '../components/ItemRow';
import '../styles/manage.css';

interface Props {
  items: Item[];
  onItemsChange: (items: Item[]) => void;
  receiptDetails: ReceiptDetails;
  friends: Friend[];
  onAddFriend: (username: string) => Promise<Friend>;
  errorMessage: string | null;
  isSaving: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

export default function ManageItemsScreen({
  items, onItemsChange, receiptDetails, friends, onAddFriend, errorMessage, isSaving, onBack, onConfirm,
}: Props) {
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  const patch = (id: string, p: Partial<Item>) =>
    onItemsChange(items.map((i) => (i.id === id ? { ...i, ...p } : i)));

  const addItem = () => {
    const item: Item = { id: uid(), name: '', price: '', usernames: [], taxCode: null };
    setFocusId(item.id);
    onItemsChange([...items, item]);
  };

  const itemsTotal = items.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0);
  const total = itemsTotal + (receiptDetails.tax ?? 0) + (receiptDetails.tip ?? 0);
  const assigning = items.find((i) => i.id === assigningId);

  return (
    <section className="screen">
      <div className="title-top">Assign Friends</div>

      <div className="manage-body">
        <div className="card items">
          <h2>Items</h2>
          {receiptDetails.warnings.map((warning) => (
            <p key={warning} className="notes">{warning}</p>
          ))}
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
          {receiptDetails.tax !== null && <div className="total">Tax: {money(receiptDetails.tax)}</div>}
          {receiptDetails.tip !== null && <div className="total">Tip: {money(receiptDetails.tip)}</div>}
          {items.length > 0 && <div className="total">Total: {money(total)}</div>}
        </div>

        <div className="assign">
          <div className="spacer" />
          {items.map((item) => (
            <div key={item.id} className="arow">
              <span className="arow-label">{item.name || 'Unnamed item'}</span>
              {item.usernames.map((username) => {
                const f = friends.find((x) => x.username === username);
                return f ? (
                  <Avatar
                    key={username}
                    friend={f}
                    title={`Remove ${f.name}`}
                    onClick={() => patch(item.id, { usernames: item.usernames.filter((x) => x !== username) })}
                  />
                ) : null;
              })}
              <button type="button" className="plus" aria-label="Assign friends" onClick={() => setAssigningId(item.id)}>+</button>
            </div>
          ))}
        </div>
      </div>

      <div className="footer">
        {errorMessage && <p className="error-text">{errorMessage}</p>}
        <button type="button" className="btn" onClick={onBack}>Back</button>
        <button type="button" className="btn" onClick={onConfirm} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Confirm'}
        </button>
      </div>

      {assigning && (
        <FriendModal
          title="Who shares this item?"
          friends={friends}
          selectable
          initialSelected={assigning.usernames}
          onAddFriend={onAddFriend}
          onDone={(usernames) => { patch(assigning.id, { usernames }); setAssigningId(null); }}
          onClose={() => setAssigningId(null)}
        />
      )}
    </section>
  );
}
