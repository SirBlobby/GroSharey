import { useState } from 'react';
import type { Friend } from '../types';
import { money } from '../utils';
import {
  AssistantIcon, BellAlertIcon, CheckIcon, ManualEntryIcon, ReceiptIcon, ShoppingListsIcon, UserIcon,
} from '../components/icons';
import Avatar from '../components/Avatar';
import BalanceCard from '../components/BalanceCard';
import PendingPaymentsCard from '../components/payments/PendingPaymentsCard';
import ReminderButton from '../components/payments/ReminderButton';
import type { Payment } from '../types/payment';
import FriendOverviewHeader from '../components/FriendOverviewHeader';
import SharedSplits from '../components/profile/SharedSplits';
import GroupOverviewCard from '../components/groups/GroupOverviewCard';
import GroupSplits from '../components/groups/GroupSplits';
import HomeGroupList from '../components/groups/HomeGroupList';
import type { Group } from '../types/group';
import Logo from '../components/Logo';
import NotificationBell from '../components/notifications/NotificationBell';
import type { NotificationCenter } from '../hooks/useNotifications';
import type { AppNotification } from '../types/notification';
import FriendModal from '../components/FriendModal';
import '../styles/main.css';
import '../styles/homeGroups.css';

interface Props {
  currentUsername: string;
  friends: Friend[];
  people: Friend[];
  selectedFriend: Friend | undefined;
  errorMessage: string | null;
  onSelectFriend: (username: string) => void;
  onAddFriend: (username: string) => Promise<Friend>;
  onSettleUp: (friend: Friend, amount: number) => Promise<void>;
  paymentsToConfirm: Payment[];
  paymentsAwaitingFriends: Payment[];
  onConfirmPayment: (paymentId: string) => Promise<void>;
  onScan: () => void;
  onManual: () => void;
  onShowSettings: () => void;
  onShowShoppingLists: () => void;
  onShowAssistant: () => void;
  groups: Group[];
  onOpenShoppingList: (listId: string | null) => void;
  onManageGroups: () => void;
  onStartTrip: (groupId: string, store: string) => Promise<void>;
  onEndTrip: (groupId: string) => Promise<void>;
  onViewProfile: (username: string) => void;
  notificationCenter: NotificationCenter;
  onOpenNotification: (notification: AppNotification) => void;
}

export default function MainScreen({
  currentUsername, friends, people, selectedFriend, errorMessage, onSelectFriend, onAddFriend, onSettleUp,
  onScan, onManual, onShowSettings, onShowShoppingLists, onShowAssistant, onViewProfile, notificationCenter, onOpenNotification,
  groups, onOpenShoppingList, onManageGroups, onStartTrip, onEndTrip,
  paymentsToConfirm, paymentsAwaitingFriends, onConfirmPayment,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const selectedGroup = groups.find((group) => group.id === selectedGroupId);

  return (
    <section className="screen">
      <div className="topbar">
        <span className="brand"><Logo className="brand-logo" />groSharey</span>
        <div className="topbar-actions">
          <button type="button" aria-label="Voice assistant" title="Voice assistant" onClick={onShowAssistant}>
            <AssistantIcon />
          </button>
          <button type="button" aria-label="Shopping lists" title="Shopping lists" onClick={onShowShoppingLists}>
            <ShoppingListsIcon />
          </button>
          <NotificationBell notificationCenter={notificationCenter} onOpenNotification={onOpenNotification} />
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
                className={`friend ${!selectedGroup && f.username === selectedFriend?.username ? 'sel' : ''}`}
                onClick={() => { setSelectedGroupId(null); onSelectFriend(f.username); }}
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
                {f.balance === 0 && (
                  <span className="badge badge--settled" title={`You and ${f.name} are settled up`} aria-label="Settled up">
                    <CheckIcon />
                  </span>
                )}
              </button>
            ))}
          </div>
          <button type="button" className="plus" aria-label="Add friend" onClick={() => setAdding(true)}>+</button>
          {friends.some((f) => f.balance > 0) && (
            <ReminderButton usernames={null} label="Remind everyone who owes you" className="reminder--friends" />
          )}
          <HomeGroupList
            groups={groups}
            selectedGroupId={selectedGroup?.id ?? null}
            onSelectGroup={setSelectedGroupId}
            onNewGroup={onManageGroups}
          />
        </div>

        <div className="home-details">
          <PendingPaymentsCard
            paymentsToConfirm={paymentsToConfirm}
            peopleByUsername={new Map(people.map((person) => [person.username, person]))}
            onConfirm={onConfirmPayment}
          />
          {selectedGroup ? (
            <GroupOverviewCard
              group={selectedGroup}
              friends={friends}
              currentUsername={currentUsername}
              onOpenShoppingList={onOpenShoppingList}
              onManageGroups={onManageGroups}
              onStartTrip={onStartTrip}
              onEndTrip={onEndTrip}
            />
          ) : (
            <BalanceCard
              friend={selectedFriend}
              onSettleUp={onSettleUp}
              waitingAmount={paymentsAwaitingFriends
                .filter((payment) => payment.to_username === selectedFriend?.username)
                .reduce((total, payment) => total + payment.amount, 0)}
              header={selectedFriend && <FriendOverviewHeader friend={selectedFriend} onViewProfile={onViewProfile} />}
            />
          )}

          <div className="home-lower">
            {selectedGroup && (
              <GroupSplits key={selectedGroup.id} group={selectedGroup} currentUsername={currentUsername} people={people} />
            )}
            {!selectedGroup && selectedFriend && (
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
