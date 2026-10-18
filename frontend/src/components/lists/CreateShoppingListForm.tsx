import { FormEvent, useState } from "react";

import { Group } from "../../types/group";
import { NewShoppingList } from "../../types/shoppingList";

type CreateShoppingListFormProps = {
  groupsWithoutList: Group[];
  onCreate: (newList: NewShoppingList) => Promise<boolean>;
};

const PERSONAL_LIST = "";

export default function CreateShoppingListForm({ groupsWithoutList, onCreate }: CreateShoppingListFormProps) {
  const [listName, setListName] = useState("");
  const [groupId, setGroupId] = useState(PERSONAL_LIST);
  const [isCreating, setIsCreating] = useState(false);

  async function createList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    const wasCreated = await onCreate({ name: listName.trim(), group_id: groupId || null });
    setIsCreating(false);
    if (wasCreated) {
      setListName("");
      setGroupId(PERSONAL_LIST);
    }
  }

  return (
    <form className="create-list-form" onSubmit={createList}>
      <h3>New list</h3>
      <input
        value={listName}
        maxLength={50}
        placeholder="List name"
        aria-label="List name"
        onChange={(event) => setListName(event.target.value)}
      />
      <select value={groupId} aria-label="Who the list is for" onChange={(event) => setGroupId(event.target.value)}>
        <option value={PERSONAL_LIST}>Just me</option>
        {groupsWithoutList.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name} (group)
          </option>
        ))}
      </select>
      <button type="submit" className="btn" disabled={isCreating || listName.trim().length === 0}>
        {isCreating ? "Creating..." : "Create list"}
      </button>
    </form>
  );
}
