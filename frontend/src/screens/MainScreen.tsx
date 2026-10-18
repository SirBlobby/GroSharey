import { useState } from 'react';
import type { Friend } from '../types';
import { money } from '../utils';
import { HistoryIcon, LogOutIcon, ReceiptIcon, UserIcon } from '../components/icons';
import Avatar from '../components/Avatar';
import BalanceCard from '../components/BalanceCard';
import Logo from '../components/Logo';
import FriendModal from '../components/FriendModal';
import '../styles/main.css';

interface Props {
  friends: Friend[];
  selectedFriend: Friend | undefined;
  errorMessage: string | null;
  onSelectFriend: (username: string) => void;
  onAddFriend: (username: string) => Promise<Friend>;
  onSettleUp: (friend: Friend) => Promise<void>;
  onScan: () => void;
  onManual: () => void;
  onShowSettings: () => void;
  onShowHistory: () => void;
  onLogout: () => void;
}

export default function MainScreen({
  friends, selectedFriend, errorMessage, onSelectFriend, onAddFriend, onSettleUp, onScan, onManual, onShowSettings, onShowHistory, onLogout,
}: Props) {
  const [adding, setAdding] = useState(false);

  return (
    <section className="screen">
      <div className="topbar">
        <span className="brand"><Logo className="brand-logo" />groSharey</span>
        <div className="topbar-actions">
          <button type="button" onClick={onShowHistory}>History <HistoryIcon /></button>
          <button type="button" onClick={onLogout}>Log Out <LogOutIcon /></button>
          <button type="button" aria-label="Settings" onClick={onShowSettings}><UserIcon /></button>
        </div>
      </div>

      <div className="main-grid">
        <div className="card friends">
          <h2>Friends</h2>
          {errorMessage && <p className="error-text">{errorMessage}</p>}
          <div className="flist">
            {friends.map((f) => (
              <button
                key={f.username}
                type="button"
                className={`friend ${f.username === selectedFriend?.username ? 'sel' : ''}`}
                onClick={() => onSelectFriend(f.username)}
              >
                <span className="friend-identity">
                  <Avatar friend={f} />
                  <span>{f.name}</span>
                </span>
                {f.balance < 0 && <span className="badge">{money(-f.balance)}</span>}
                {f.balance > 0 && <span className="badge badge--owed">{money(f.balance)}</span>}
              </button>
            ))}
          </div>
          <button type="button" className="plus" aria-label="Add friend" onClick={() => setAdding(true)}>+</button>
        </div>

        <BalanceCard friend={selectedFriend} onSettleUp={onSettleUp} />

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
          onAddFriend={async (username) => {
            const f = await onAddFriend(username);
            onSelectFriend(f.username);
            return f;
          }}
          onClose={() => setAdding(false)}
        />
      )}
    </section>
  );
}
