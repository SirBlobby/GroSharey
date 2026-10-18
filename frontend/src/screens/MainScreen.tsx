import { useState } from 'react';
import type { Friend } from '../types';
import { money } from '../utils';
import { BellAlertIcon, HistoryIcon, LogOutIcon, ManualEntryIcon, ReceiptIcon, UserIcon } from '../components/icons';
import Avatar from '../components/Avatar';
import BalanceCard from '../components/BalanceCard';
import FriendOverviewHeader from '../components/FriendOverviewHeader';
import SharedSplits from '../components/profile/SharedSplits';
import Logo from '../components/Logo';
import NotificationBell from '../components/notifications/NotificationBell';
import type { NotificationCenter } from '../hooks/useNotifications';
import type { AppNotification } from '../types/notification';
import FriendModal from '../components/FriendModal';
import '../styles/main.css';

interface Props {
  currentUsername: string;
  friends: Friend[];
  people: Friend[];
  selectedFriend: Friend | undefined;
  errorMessage: string | null;
  onSelectFriend: (username: string) => void;
  onAddFriend: (username: string) => Promise<Friend>;
  onSettleUp: (friend: Friend, amount: number) => Promise<void>;
  onScan: () => void;
  onManual: () => void;
  onShowSettings: () => void;
  onShowHistory: () => void;
  onViewProfile: (username: string) => void;
  notificationCenter: NotificationCenter;
  onOpenNotification: (notification: AppNotification) => void;
  onLogout: () => void;
}

export default function MainScreen({
  currentUsername, friends, people, selectedFriend, errorMessage, onSelectFriend, onAddFriend, onSettleUp,
  onScan, onManual, onShowSettings, onShowHistory, onViewProfile, notificationCenter, onOpenNotification, onLogout,
}: Props) {
  const [adding, setAdding] = useState(false);

  return (
    <section className="screen">
      <div className="topbar">
        <span className="brand"><Logo className="brand-logo" />groSharey</span>
        <div className="topbar-actions">
          <NotificationBell notificationCenter={notificationCenter} onOpenNotification={onOpenNotification} />
          <button type="button" aria-label="History" onClick={onShowHistory}><span className="topbar-label">History</span> <HistoryIcon /></button>
          <button type="button" aria-label="Log Out" onClick={onLogout}><span className="topbar-label">Log Out</span> <LogOutIcon /></button>
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
                {f.balance < 0 && (
                  <span className="badge" title={`You owe ${f.name}`}>
                    <BellAlertIcon /> {money(-f.balance)}
                  </span>
                )}
                {f.balance > 0 && (
                  <span className="badge badge--owed" title={`${f.name} owes you`}>
                    <BellAlertIcon /> {money(f.balance)}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button type="button" className="plus" aria-label="Add friend" onClick={() => setAdding(true)}>+</button>
        </div>

        <div className="home-details">
          <BalanceCard
            friend={selectedFriend}
            onSettleUp={onSettleUp}
            header={selectedFriend && <FriendOverviewHeader friend={selectedFriend} onViewProfile={onViewProfile} />}
          />

          <div className="home-lower">
            {selectedFriend && (
              <SharedSplits
                key={selectedFriend.username}
                friendUsername={selectedFriend.username}
                friendName={selectedFriend.name}
                currentUsername={currentUsername}
                people={people}
              />
            )}

            <div className="card log">
              <h2>Log a grocery run!</h2>
              <div className="choices">
                <button type="button" className="choice" onClick={onScan}>
                  <ReceiptIcon />
                  Scan Receipt
                </button>
                <span className="or">OR</span>
                <button type="button" className="choice" onClick={onManual}>
                  <ManualEntryIcon />
                  Manual Entry
                </button>
              </div>
            </div>
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
