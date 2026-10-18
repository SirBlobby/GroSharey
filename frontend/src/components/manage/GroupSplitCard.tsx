import { SplitGroup } from "../../services/splits";
import { Group } from "../../types/group";
import { CloseIcon, GroupsIcon, MatchItemsIcon } from "../icons";
import "../../styles/settings.css";
import "../../styles/groups.css";

type GroupSplitCardProps = {
  groups: Group[];
  splitGroup: SplitGroup | null;
  isMatching: boolean;
  errorMessage: string | null;
  onChooseGroup: (group: Group) => void;
  onClearGroup: () => void;
};

function describeMatch(splitGroup: SplitGroup): string {
  if (!splitGroup.shoppingListName) {
    return splitGroup.shoppingListMatches === null
      ? `Items will be matched to ${splitGroup.groupName}'s shopping list when you confirm.`
      : `${splitGroup.groupName} doesn't have a shopping list yet.`;
  }
  if (splitGroup.matchedItemCount === 0) {
    return `Nothing here matched the ${splitGroup.shoppingListName} list.`;
  }
  const itemWord = splitGroup.matchedItemCount === 1 ? "item" : "items";
  return `Matched ${splitGroup.matchedItemCount} ${itemWord} from the ${splitGroup.shoppingListName} list. They get crossed off when you confirm.`;
}

export default function GroupSplitCard({
  groups,
  splitGroup,
  isMatching,
  errorMessage,
  onChooseGroup,
  onClearGroup,
}: GroupSplitCardProps) {
  return (
    <div className="card split-group">
      <div className="split-group-header">
        <h2>Group</h2>
        {splitGroup && (
          <button type="button" className="group-action" onClick={onClearGroup} disabled={isMatching}>
            <CloseIcon /> Remove group
          </button>
        )}
      </div>
      {groups.length === 0 ? (
        <p className="description">Make a group in Settings to match items to a shared shopping list.</p>
      ) : (
        <>
          <p className="description">
            <MatchItemsIcon /> Pick a group to assign items to whoever asked for them on the group's list.
          </p>
          <div className="split-group-options" role="radiogroup" aria-label="Group for this split">
            {groups.map((group) => {
              const isSelected = splitGroup?.groupId === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`option-button ${isSelected ? "selected" : ""}`}
                  disabled={isMatching}
                  onClick={() => onChooseGroup(group)}
                >
                  <GroupsIcon /> {group.name}
                </button>
              );
            })}
          </div>
        </>
      )}
      {isMatching && <p className="split-group-status">Matching items to the shopping list...</p>}
      {!isMatching && splitGroup && <p className="split-group-status">{describeMatch(splitGroup)}</p>}
      {errorMessage && <p className="error-text">{errorMessage}</p>}
    </div>
  );
}
