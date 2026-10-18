import type { Friend } from "../../types";
import { ShoppingListItem } from "../../types/shoppingList";
import Avatar from "../Avatar";
import { CheckedBoxIcon, CloseIcon, EditIcon, LocationIcon, UncheckedBoxIcon } from "../icons";

type ShoppingListItemRowProps = {
  item: ShoppingListItem;
  requester: Friend | undefined;
  onToggle: () => void;
  onRemove: () => void;
};

export default function ShoppingListItemRow({ item, requester, onToggle, onRemove }: ShoppingListItemRowProps) {
  return (
    <li className={`shopping-item ${item.is_crossed_off ? "shopping-item--crossed" : ""}`}>
      <button
        type="button"
        className="shopping-item-check"
        role="checkbox"
        aria-checked={item.is_crossed_off}
        aria-label={`${item.is_crossed_off ? "Uncross" : "Cross off"} ${item.name}`}
        onClick={onToggle}
      >
        {item.is_crossed_off ? <CheckedBoxIcon /> : <UncheckedBoxIcon />}
      </button>
      <div className="shopping-item-text">
        <span className="shopping-item-name">
          {item.name}
          {item.quantity && <span className="shopping-item-quantity">{item.quantity}</span>}
        </span>
        {item.store && (
          <span className="shopping-item-detail">
            <LocationIcon /> {item.store}
          </span>
        )}
        {item.notes && (
          <span className="shopping-item-detail">
            <EditIcon /> {item.notes}
          </span>
        )}
        {item.is_crossed_off && item.crossed_off_by && (
          <span className="shopping-item-note">
            Crossed off by @{item.crossed_off_by}
            {item.bought_at && ` - bought at ${item.bought_at}`}
          </span>
        )}
      </div>
      {requester && (
        <span className="shopping-item-requester" title={`Requested by ${requester.name}`}>
          <Avatar friend={requester} />
          <span>{requester.name}</span>
        </span>
      )}
      <button type="button" className="del" aria-label={`Remove ${item.name}`} onClick={onRemove}>
        <CloseIcon />
      </button>
    </li>
  );
}
