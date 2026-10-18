import { BackIcon } from "../components/icons";
import ShoppingListMenu from "../components/lists/ShoppingListMenu";
import ShoppingListPanel from "../components/lists/ShoppingListPanel";
import { useShoppingLists } from "../hooks/useShoppingLists";
import { Group } from "../types/group";
import "../styles/main.css";
import "../styles/account.css";
import "../styles/settings.css";
import "../styles/manage.css";
import "../styles/groups.css";
import "../styles/shoppingLists.css";

type ShoppingListsScreenProps = {
  groups: Group[];
  currentUsername: string;
  initialListId: string | null;
  onBack: () => void;
};

export default function ShoppingListsScreen({ groups, currentUsername, initialListId, onBack }: ShoppingListsScreenProps) {
  const listCenter = useShoppingLists(initialListId);
  const selectedList = listCenter.selectedList;

  function deleteSelectedList() {
    if (selectedList && window.confirm(`Delete the ${selectedList.name} list?`)) {
      listCenter.deleteList(selectedList.id);
    }
  }

  return (
    <section className="screen account">
      <div className="topbar">
        <span>Shopping Lists</span>
        <button type="button" onClick={onBack}>
          <BackIcon /> <span className="topbar-label">Back to Home</span>
        </button>
      </div>

      <div className="settings-layout">
        <ShoppingListMenu
          shoppingLists={listCenter.shoppingLists}
          selectedListId={selectedList?.id ?? null}
          groups={groups}
          onSelectList={listCenter.selectList}
          onCreateList={listCenter.createList}
        />
        {selectedList ? (
          <ShoppingListPanel
            shoppingList={selectedList}
            currentUsername={currentUsername}
            onAddItem={(newItem) => listCenter.addItem(selectedList.id, newItem)}
            onSetItemCrossedOff={(itemId, isCrossedOff) =>
              listCenter.setItemCrossedOff(selectedList.id, itemId, isCrossedOff)
            }
            onRemoveItem={(itemId) => listCenter.removeItem(selectedList.id, itemId)}
            onDeleteList={deleteSelectedList}
          />
        ) : (
          <div className="card settings-panel">
            <h2>Shopping Lists</h2>
            <p className="empty">
              {listCenter.isLoading ? "Loading..." : "Make a list for yourself or for one of your groups."}
            </p>
          </div>
        )}
      </div>
      {listCenter.errorMessage && <p className="error-text lists-error">{listCenter.errorMessage}</p>}
    </section>
  );
}
