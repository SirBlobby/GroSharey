import { useState } from "react";

import type { GroupList } from "../../hooks/useGroups";
import type { Friend } from "../../types";
import { Group } from "../../types/group";
import { readErrorMessage } from "../../utils";
import GroupCard from "../groups/GroupCard";
import GroupEditorModal from "../groups/GroupEditorModal";
import { GroupsIcon } from "../icons";
import "../../styles/groups.css";

type GroupManagerProps = {
  groupList: GroupList;
  friends: Friend[];
  currentUsername: string;
  onOpenShoppingList: (listId: string | null) => void;
};

type EditorState = { group: Group | null } | null;

export default function GroupManager({ groupList, friends, currentUsername, onOpenShoppingList }: GroupManagerProps) {
  const [editorState, setEditorState] = useState<EditorState>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function runAction(confirmText: string, action: () => Promise<void>, successText: string) {
    if (!window.confirm(confirmText)) {
      return;
    }
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      await action();
      setStatusMessage(successText);
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Couldn't update that group"));
    }
  }

  const editingGroup = editorState?.group ?? null;

  return (
    <div className="card settings-panel">
      <div className="friend-manager-header">
        <h2>Groups</h2>
        <span className="friend-count">{groupList.groups.length}</span>
        <button type="button" className="group-action group-new" onClick={() => setEditorState({ group: null })}>
          <GroupsIcon /> New group
        </button>
      </div>
      <p className="description">
        Groups share one shopping list. Add a group to a split and items get matched to whoever asked for them.
      </p>

      {statusMessage && <p className="status-text">{statusMessage}</p>}
      {(errorMessage ?? groupList.errorMessage) && <p className="error-text">{errorMessage ?? groupList.errorMessage}</p>}
      {groupList.isLoading && <p className="description">Loading...</p>}
      {!groupList.isLoading && groupList.groups.length === 0 && (
        <p className="empty">No groups yet.<br />Make one for your roommates.</p>
      )}

      <ul className="group-list">
        {groupList.groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            currentUsername={currentUsername}
            onEdit={() => setEditorState({ group })}
            onDelete={() =>
              runAction(
                `Delete ${group.name} and its shopping list?`,
                () => groupList.deleteGroup(group.id),
                `${group.name} was deleted.`,
              )
            }
            onLeave={() =>
              runAction(`Leave ${group.name}?`, () => groupList.leaveGroup(group.id), `You left ${group.name}.`)
            }
            onOpenShoppingList={() => onOpenShoppingList(group.shopping_list_id)}
          />
        ))}
      </ul>

      {editorState && (
        <GroupEditorModal
          group={editingGroup}
          friends={friends}
          currentUsername={currentUsername}
          onSave={(groupRequest) =>
            editingGroup ? groupList.updateGroup(editingGroup.id, groupRequest) : groupList.createGroup(groupRequest)
          }
          onClose={() => setEditorState(null)}
        />
      )}
    </div>
  );
}
