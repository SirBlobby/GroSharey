import { useState } from 'react';
import type { Friend } from '../types';
import { money } from '../utils';
import { ReceiptIcon, UserIcon } from '../components/icons';
import FriendModal from '../components/FriendModal';
import '../styles/main.css';

interface Props {
  friends: Friend[];
  selectedFriendId: number | null;
  onSelectFriend: (id: number) => void;
  onAddFriend: (name: string) => Friend;
  onScan: () => void;
  onManual: () => void;
  onLogout: () => void;
}

export default function MainScreen({
  friends, selectedFriendId, onSelectFriend, onAddFriend, onScan, onManual, onLogout,
}: Props) {
  const [adding, setAdding] = useState(false);
  const selected = friends.find((f) => f.id === selectedFriendId);

  return (
    <section className="screen">
      <div className="topbar">
        <span>(logo)</span>
        <button type="button" onClick={onLogout}>Log Out <UserIcon /></button>
      </div>

      <div className="main-grid">
        <div className="card friends">
          <h2>Friends</h2>
          <div className="flist">
            {friends.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`friend ${f.id === selectedFriendId ? 'sel' : ''}`}
                onClick={() => onSelectFriend(f.id)}
              >
                <span>{f.name}</span>
                {f.owed > 0 && <span className="badge">{money(f.owed)}</span>}
              </button>
            ))}
          </div>
          <button type="button" className="plus" aria-label="Add friend" onClick={() => setAdding(true)}>+</button>
        </div>

        <div className="card owe">
          {!selected ? (
            <h2>Add a friend to get started</h2>
          ) : selected.owed > 0 ? (
            <>
              <div>
                <h2>You owe {selected.name}</h2>
                <div className="amt">{money(selected.owed)}</div>
              </div>
              <div className="pay">
                pay with
                <button type="button" className="paypal">PayPal</button>
              </div>
            </>
          ) : (
            <div>
              <h2>You and {selected.name}</h2>
              <div className="amt ok">are all settled up!</div>
            </div>
          )}
        </div>

        <div className="card log">
          <h2>Log a grocery run!</h2>
          <div className="choices">
            <button type="button" className="choice" onClick={onScan}>
              Scan Receipt
              <ReceiptIcon />
            </button>
            <span className="or">OR</span>
            <button type="button" className="choice" onClick={onManual}>Manual<br />Entry</button>
          </div>
        </div>
      </div>

      {adding && (
        <FriendModal
          title="Add a friend"
          friends={friends}
          selectable={false}
          onAddFriend={(name) => {
            const f = onAddFriend(name);
            onSelectFriend(f.id);
            return f;
          }}
          onClose={() => setAdding(false)}
        />
      )}
    </section>
  );
}
