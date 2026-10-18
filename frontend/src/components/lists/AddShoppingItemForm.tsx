import { FormEvent, useState } from "react";

import type { Friend } from "../../types";
import { NewShoppingListItem } from "../../types/shoppingList";

type AddShoppingItemFormProps = {
  members: Friend[];
  currentUsername: string;
  isGroupList: boolean;
  onAdd: (newItem: NewShoppingListItem) => Promise<boolean>;
};

export default function AddShoppingItemForm({ members, currentUsername, isGroupList, onAdd }: AddShoppingItemFormProps) {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [store, setStore] = useState("");
  const [notes, setNotes] = useState("");
  const [requestedBy, setRequestedBy] = useState(currentUsername);
  const [isAdding, setIsAdding] = useState(false);

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsAdding(true);
    const wasAdded = await onAdd({
      name: itemName.trim(),
      quantity: quantity.trim() || null,
      store: store.trim() || null,
      notes: notes.trim() || null,
      requested_by: isGroupList ? requestedBy : null,
    });
    setIsAdding(false);
    if (wasAdded) {
      setItemName("");
      setQuantity("");
      setStore("");
      setNotes("");
    }
  }

  return (
    <form className="add-shopping-item" onSubmit={addItem}>
      <input
        className="add-shopping-item-name"
        value={itemName}
        maxLength={80}
        placeholder="Add an item"
        aria-label="Item name"
        onChange={(event) => setItemName(event.target.value)}
      />
      <input
        className="add-shopping-item-quantity"
        value={quantity}
        maxLength={30}
        placeholder="Qty"
        aria-label="Quantity"
        onChange={(event) => setQuantity(event.target.value)}
      />
      <input
        className="add-shopping-item-store"
        value={store}
        maxLength={80}
        placeholder="Store or location (optional)"
        aria-label="Store or location"
        onChange={(event) => setStore(event.target.value)}
      />
      <input
        className="add-shopping-item-notes"
        value={notes}
        maxLength={200}
        placeholder="Notes (optional)"
        aria-label="Notes"
        onChange={(event) => setNotes(event.target.value)}
      />
      {isGroupList && (
        <select value={requestedBy} aria-label="Who it's for" onChange={(event) => setRequestedBy(event.target.value)}>
          {members.map((member) => (
            <option key={member.username} value={member.username}>
              For {member.username === currentUsername ? "me" : member.name}
            </option>
          ))}
        </select>
      )}
      <button type="submit" className="btn" disabled={isAdding || itemName.trim().length === 0}>
        {isAdding ? "Adding..." : "Add"}
      </button>
    </form>
  );
}
