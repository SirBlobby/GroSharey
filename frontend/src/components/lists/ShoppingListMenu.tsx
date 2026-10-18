import { Group } from "../../types/group";
import { NewShoppingList, ShoppingList } from "../../types/shoppingList";
import { GroupsIcon, ShoppingListIcon } from "../icons";
import CreateShoppingListForm from "./CreateShoppingListForm";

type ShoppingListMenuProps = {
  shoppingLists: ShoppingList[];
  selectedListId: string | null;
  groups: Group[];
  onSelectList: (listId: string) => void;
  onCreateList: (newList: NewShoppingList) => Promise<boolean>;
};

function countOpenItems(shoppingList: ShoppingList): number {
  return shoppingList.items.filter((item) => !item.is_crossed_off).length;
}

export default function ShoppingListMenu({
  shoppingLists,
  selectedListId,
  groups,
  onSelectList,
  onCreateList,
}: ShoppingListMenuProps) {
  const groupIdsWithList = new Set(shoppingLists.map((shoppingList) => shoppingList.group_id));
  const groupsWithoutList = groups.filter((group) => !groupIdsWithList.has(group.id));

  return (
    <nav className="card lists-menu" aria-label="Shopping lists">
      <h2>Lists</h2>
      {shoppingLists.length === 0 && <p className="description">No lists yet. Make one below.</p>}
      <ul className="lists-menu-list">
        {shoppingLists.map((shoppingList) => {
          const isSelected = shoppingList.id === selectedListId;
          return (
            <li key={shoppingList.id}>
              <button
                type="button"
                className={`lists-menu-item ${isSelected ? "active" : ""}`}
                aria-current={isSelected ? "page" : undefined}
                onClick={() => onSelectList(shoppingList.id)}
              >
                {shoppingList.group_id ? <GroupsIcon /> : <ShoppingListIcon />}
                <span className="lists-menu-names">
                  <span className="lists-menu-name">{shoppingList.name}</span>
                  <span className="lists-menu-owner">{shoppingList.group_name ?? "Personal"}</span>
                </span>
                <span className="items-count">{countOpenItems(shoppingList)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <CreateShoppingListForm groupsWithoutList={groupsWithoutList} onCreate={onCreateList} />
    </nav>
  );
}
