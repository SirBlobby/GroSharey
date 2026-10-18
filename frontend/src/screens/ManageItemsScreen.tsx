import { useState } from 'react';
import type { Friend, Item } from '../types';
import type { ReceiptDetails } from '../services/splits';
import { uid } from '../utils';
import { BackIcon } from '../components/icons';
import FriendModal from '../components/FriendModal';
import ItemRow from '../components/ItemRow';
import SplitSummary from '../components/SplitSummary';
import '../styles/main.css';
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

  const toggleOnEveryItem = (username: string) => {
    const isOnEveryItem = items.every((i) => i.usernames.includes(username));
    onItemsChange(items.map((i) => ({
      ...i,
      usernames: isOnEveryItem
        ? i.usernames.filter((x) => x !== username)
        : [...i.usernames.filter((x) => x !== username), username],
    })));
  };

  const assigning = items.find((i) => i.id === assigningId);

  return (
    <section className="screen manage">
      <div className="topbar">
        <span>Assign Friends</span>
        <button type="button" onClick={onBack}><BackIcon /> Back</button>
      </div>

      <div className="manage-layout">
        <div className="card items">
          <div className="items-header">
            <h2>Items</h2>
            <span className="items-count">{items.length}</span>
          </div>
          {receiptDetails.warnings.map((warning) => (
            <p key={warning} className="notes">{warning}</p>
          ))}
          <div className="item-rows">
            {items.length === 0 ? (
              <div className="empty">No items yet.<br />Add one below.</div>
            ) : (
              items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  friends={friends}
                  autoFocus={item.id === focusId}
                  onChange={(p) => patch(item.id, p)}
                  onDelete={() => onItemsChange(items.filter((i) => i.id !== item.id))}
                  onAssign={() => setAssigningId(item.id)}
                />
              ))
            )}
          </div>
          <button type="button" className="add-item-button" onClick={addItem}>+ Add item</button>
        </div>

        <SplitSummary
          items={items}
          receiptDetails={receiptDetails}
          friends={friends}
          errorMessage={errorMessage}
          isSaving={isSaving}
          onToggleOnEveryItem={toggleOnEveryItem}
          onConfirm={onConfirm}
        />
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
