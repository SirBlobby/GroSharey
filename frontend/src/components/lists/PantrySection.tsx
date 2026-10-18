import type { Friend } from "../../types";
import { PantryItem } from "../../types/shoppingList";
import { formatDateTime } from "../../utils";
import Avatar from "../Avatar";
import { CloseIcon, LocationIcon, PantryIcon, RunningLowIcon } from "../icons";

type PantrySectionProps = {
  pantryItems: PantryItem[];
  membersByUsername: Map<string, Friend>;
  isGroupList: boolean;
  onMarkRunningLow: (pantryItemId: string) => void;
  onUseUp: (pantryItemId: string) => void;
};

export default function PantrySection({
  pantryItems,
  membersByUsername,
  isGroupList,
  onMarkRunningLow,
  onUseUp,
}: PantrySectionProps) {
  return (
    <div className="settings-group pantry">
      <h3>
        <PantryIcon /> Pantry ({pantryItems.length})
      </h3>
      <p className="description">
        Bought items land here. Mark one running low to put it back on the list.
      </p>
      {pantryItems.length === 0 ? (
        <p className="empty">The pantry is empty. Cross something off to stock it.</p>
      ) : (
        <ul className="shopping-items">
          {pantryItems.map((pantryItem) => {
            const requester = isGroupList ? membersByUsername.get(pantryItem.requested_by) : undefined;
            return (
              <li key={pantryItem.id} className={`shopping-item ${pantryItem.is_running_low ? "pantry-item--low" : ""}`}>
                <div className="shopping-item-text">
                  <span className="shopping-item-name">
                    {pantryItem.name}
                    {pantryItem.quantity && <span className="shopping-item-quantity">{pantryItem.quantity}</span>}
                    {pantryItem.is_running_low && <span className="pantry-low-tag">Running low</span>}
                  </span>
                  {pantryItem.store && (
                    <span className="shopping-item-detail">
                      <LocationIcon /> {pantryItem.store}
                    </span>
                  )}
                  <span className="shopping-item-note">Stocked {formatDateTime(pantryItem.stocked_at)}</span>
                </div>
                {requester && (
                  <span className="shopping-item-requester" title={`For ${requester.name}`}>
                    <Avatar friend={requester} />
                    <span>{requester.name}</span>
                  </span>
                )}
                {!pantryItem.is_running_low && (
                  <button type="button" className="shopping-item-add-again" onClick={() => onMarkRunningLow(pantryItem.id)}>
                    <RunningLowIcon /> <span>Running low</span>
                  </button>
                )}
                <button
                  type="button"
                  className="del"
                  aria-label={`${pantryItem.name} is used up`}
                  title="Used up"
                  onClick={() => onUseUp(pantryItem.id)}
                >
                  <CloseIcon />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
