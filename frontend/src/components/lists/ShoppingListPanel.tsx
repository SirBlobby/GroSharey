import { convertProfileToFriend } from "../../services/friends";
import { NewShoppingListItem, ShoppingList } from "../../types/shoppingList";
import { DeleteIcon, GroupsIcon } from "../icons";
import AddShoppingItemForm from "./AddShoppingItemForm";
import ShoppingListItemRow from "./ShoppingListItemRow";

type ShoppingListPanelProps = {
  shoppingList: ShoppingList;
  currentUsername: string;
  onAddItem: (newItem: NewShoppingListItem) => Promise<boolean>;
  onSetItemCrossedOff: (itemId: string, isCrossedOff: boolean) => void;
  onRemoveItem: (itemId: string) => void;
  onDeleteList: () => void;
};

export default function ShoppingListPanel({
  shoppingList,
  currentUsername,
  onAddItem,
  onSetItemCrossedOff,
  onRemoveItem,
  onDeleteList,
}: ShoppingListPanelProps) {
  const members = shoppingList.members.map((member) =>
    member.username === currentUsername ? { ...convertProfileToFriend(member), name: "You" } : convertProfileToFriend(member),
  );
  const membersByUsername = new Map(members.map((member) => [member.username, member]));
  const openItems = shoppingList.items.filter((item) => !item.is_crossed_off);
  const crossedOffItems = shoppingList.items.filter((item) => item.is_crossed_off);
  const isGroupList = shoppingList.group_id !== null;

  function renderItems(items: ShoppingList["items"]) {
    return (
      <ul className="shopping-items">
        {items.map((item) => (
          <ShoppingListItemRow
            key={item.id}
            item={item}
            requester={isGroupList ? membersByUsername.get(item.requested_by) : undefined}
            onToggle={() => onSetItemCrossedOff(item.id, !item.is_crossed_off)}
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
    </div>
  );
}
