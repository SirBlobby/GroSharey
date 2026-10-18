import { useState } from "react";

import { convertProfileToFriend } from "../../services/friends";
import { Group } from "../../types/group";
import { NewShoppingListItem, ShoppingList, ShoppingListItem } from "../../types/shoppingList";
import TripBanner from "../groups/TripBanner";
import { DeleteIcon, GroupsIcon } from "../icons";
import AddShoppingItemForm from "./AddShoppingItemForm";
import PantrySection from "./PantrySection";
import ShoppingListItemRow from "./ShoppingListItemRow";

function isForStore(itemStore: string | null, tripStore: string): boolean {
  if (!itemStore) {
    return true;
  }
  const itemStoreName = itemStore.toLowerCase();
  const tripStoreName = tripStore.toLowerCase();
  return itemStoreName.includes(tripStoreName) || tripStoreName.includes(itemStoreName);
}

type ShoppingListPanelProps = {
  shoppingList: ShoppingList;
  group: Group | undefined;
  currentUsername: string;
  onStartTrip: (groupId: string, store: string) => Promise<void>;
  onEndTrip: (groupId: string) => Promise<void>;
  onAddItem: (newItem: NewShoppingListItem) => Promise<boolean>;
  onSetItemCrossedOff: (itemId: string, isCrossedOff: boolean) => void;
  onRemoveItem: (itemId: string) => void;
  onMarkRunningLow: (pantryItemId: string) => void;
  onRemovePantryItem: (pantryItemId: string) => void;
  onDeleteList: () => void;
};

export default function ShoppingListPanel({
  shoppingList,
  group,
  currentUsername,
  onStartTrip,
  onEndTrip,
  onAddItem,
  onSetItemCrossedOff,
  onRemoveItem,
  onMarkRunningLow,
  onRemovePantryItem,
  onDeleteList,
}: ShoppingListPanelProps) {
  const members = shoppingList.members.map((member) =>
    member.username === currentUsername ? { ...convertProfileToFriend(member), name: "You" } : convertProfileToFriend(member),
  );
  const membersByUsername = new Map(members.map((member) => [member.username, member]));
  const [isFilteringByTrip, setIsFilteringByTrip] = useState(true);
  const tripStore = group?.active_trip?.store ?? null;
  const openItems = shoppingList.items.filter(
    (item) => !item.is_crossed_off && (!tripStore || !isFilteringByTrip || isForStore(item.store, tripStore)),
  );
  const hiddenItemCount = shoppingList.items.filter((item) => !item.is_crossed_off).length - openItems.length;
  const crossedOffItems = shoppingList.items.filter((item) => item.is_crossed_off);
  const isGroupList = shoppingList.group_id !== null;

  function addItemAgain(item: ShoppingListItem) {
    onAddItem({
      name: item.name,
      quantity: item.quantity,
      store: item.store,
      notes: item.notes,
      requested_by: isGroupList && membersByUsername.has(item.requested_by) ? item.requested_by : null,
    });
  }

  function renderItems(items: ShoppingList["items"]) {
    return (
      <ul className="shopping-items">
        {items.map((item) => (
          <ShoppingListItemRow
            key={item.id}
            item={item}
            requester={isGroupList ? membersByUsername.get(item.requested_by) : undefined}
            onToggle={() => onSetItemCrossedOff(item.id, !item.is_crossed_off)}
            onAddAgain={() => addItemAgain(item)}
            onRemove={() => onRemoveItem(item.id)}
          />
        ))}
      </ul>
    );
  }

  return (
    <div className="card settings-panel shopping-list-panel">
      <div className="shopping-list-header">
        <h2>{shoppingList.name}</h2>
        {shoppingList.group_name && (
          <span className="shopping-list-group">
            <GroupsIcon /> {shoppingList.group_name}
          </span>
        )}
        <button type="button" className="group-action group-action--danger shopping-list-delete" onClick={onDeleteList}>
          <DeleteIcon /> Delete list
        </button>
      </div>
      {isGroupList && (
        <p className="description">
          When someone logs a split with {shoppingList.group_name}, bought items are matched and crossed off here.
        </p>
      )}

      {group && (
        <TripBanner group={group} currentUsername={currentUsername} onStartTrip={onStartTrip} onEndTrip={onEndTrip} />
      )}
      {tripStore && (
        <label className="toggle-row trip-filter">
          <input
            type="checkbox"
            checked={isFilteringByTrip}
            onChange={(event) => setIsFilteringByTrip(event.target.checked)}
          />
          <span>
            Only show items for {tripStore}
            {isFilteringByTrip && hiddenItemCount > 0 && ` (${hiddenItemCount} hidden)`}
          </span>
        </label>
      )}

      <AddShoppingItemForm
        key={shoppingList.id}
        members={members}
        currentUsername={currentUsername}
        isGroupList={isGroupList}
        onAdd={onAddItem}
      />

      {openItems.length === 0 ? <p className="empty">Nothing left to buy.</p> : renderItems(openItems)}

      {crossedOffItems.length > 0 && (
        <div className="settings-group">
          <h3>Crossed off ({crossedOffItems.length})</h3>
          {renderItems(crossedOffItems)}
        </div>
      )}

      <PantrySection
        pantryItems={shoppingList.pantry}
        membersByUsername={membersByUsername}
        isGroupList={isGroupList}
        onMarkRunningLow={onMarkRunningLow}
        onUseUp={onRemovePantryItem}
      />
    </div>
  );
}
