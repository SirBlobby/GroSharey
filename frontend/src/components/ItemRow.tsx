import type { Friend, Item } from '../types';
import { formatPrice } from '../utils';
import Avatar from './Avatar';
import { AddFriendIcon, CloseIcon } from './icons';

interface Props {
  item: Item;
  friends: Friend[];
  autoFocus?: boolean;
  onChange: (patch: Partial<Item>) => void;
  onDelete: () => void;
  onAssign: () => void;
}

export default function ItemRow({ item, friends, autoFocus, onChange, onDelete, onAssign }: Props) {
  const assignedFriends = item.usernames
    .map((username) => friends.find((friend) => friend.username === username))
    .filter((friend): friend is Friend => Boolean(friend));

  return (
    <div className={`row ${assignedFriends.length === 0 ? 'row--unassigned' : ''}`}>
      <div className="row-fields">
        <input
          className="name"
          value={item.name}
          placeholder="Item name"
          aria-label="Item name"
          autoFocus={autoFocus}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <div className="price-wrap">
          <span>$</span>
          <input
            value={item.price}
            inputMode="decimal"
            placeholder="0.00"
            aria-label="Price"
            onChange={(e) => onChange({ price: e.target.value })}
            onBlur={(e) => onChange({ price: formatPrice(e.target.value) })}
          />
        </div>
        <button type="button" className="del" aria-label="Remove item" onClick={onDelete}><CloseIcon /></button>
      </div>

      <div className="row-people">
        {assignedFriends.map((friend) => (
          <Avatar
            key={friend.username}
            friend={friend}
            title={`Remove ${friend.name}`}
            onClick={() => onChange({ usernames: item.usernames.filter((username) => username !== friend.username) })}
          />
        ))}
        <button type="button" className="assign-chip" onClick={onAssign}>
          <AddFriendIcon /> {assignedFriends.length === 0 ? 'Assign people' : 'Edit'}
        </button>
      </div>
    </div>
  );
}
