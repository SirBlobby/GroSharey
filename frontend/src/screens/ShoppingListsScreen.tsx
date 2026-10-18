import { BackIcon } from "../components/icons";
import ShoppingListMenu from "../components/lists/ShoppingListMenu";
import ShoppingListPanel from "../components/lists/ShoppingListPanel";
import type { GroupList } from "../hooks/useGroups";
import { useShoppingLists } from "../hooks/useShoppingLists";
import "../styles/main.css";
import "../styles/account.css";
import "../styles/settings.css";
import "../styles/manage.css";
import "../styles/groups.css";
import "../styles/shoppingLists.css";

type ShoppingListsScreenProps = {
  groupList: GroupList;
  currentUsername: string;
  initialListId: string | null;
  onBack: () => void;
};

export default function ShoppingListsScreen({
  groupList,
  currentUsername,
  initialListId,
  onBack,
}: ShoppingListsScreenProps) {
  const listCenter = useShoppingLists(initialListId, currentUsername);
  const waitingChangeCount = listCenter.waitingChangeCount;
  const changeWord = waitingChangeCount === 1 ? "change" : "changes";
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

      {(listCenter.isOffline || waitingChangeCount > 0) && (
        <p className="offline-banner" role="status">
          {listCenter.isOffline ? "You're offline. " : "Syncing... "}
          {waitingChangeCount > 0
            ? `${waitingChangeCount} ${changeWord} will sync when you're back online.`
            : "You can still cross items off and add new ones."}
        </p>
      )}

      <div className="settings-layout">
        <ShoppingListMenu
          shoppingLists={listCenter.shoppingLists}
          selectedListId={selectedList?.id ?? null}
          groups={groupList.groups}
          onSelectList={listCenter.selectList}
          onCreateList={listCenter.createList}
        />
        {selectedList ? (
          <ShoppingListPanel
            shoppingList={selectedList}
            group={groupList.groups.find((group) => group.id === selectedList.group_id)}
            currentUsername={currentUsername}
            onStartTrip={groupList.startTrip}
            onEndTrip={groupList.endTrip}
            onAddItem={(newItem) => listCenter.addItem(selectedList.id, newItem)}
            onSetItemCrossedOff={(itemId, isCrossedOff) =>
              listCenter.setItemCrossedOff(selectedList.id, itemId, isCrossedOff)
            }
            onRemoveItem={(itemId) => listCenter.removeItem(selectedList.id, itemId)}
            onMarkRunningLow={(pantryItemId) => listCenter.markRunningLow(selectedList.id, pantryItemId)}
            onRemovePantryItem={(pantryItemId) => listCenter.removePantryItem(selectedList.id, pantryItemId)}
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
