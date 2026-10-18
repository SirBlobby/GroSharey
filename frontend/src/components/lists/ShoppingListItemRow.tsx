import type { Friend } from "../../types";
import { PriceComparison } from "../../types/insights";
import { money } from "../../utils";
import { ShoppingListItem } from "../../types/shoppingList";
import Avatar from "../Avatar";
import {
  AddAgainIcon,
  CheckedBoxIcon,
  CloseIcon,
  EditIcon,
  LocationIcon,
  PriceTagIcon,
  UncheckedBoxIcon,
} from "../icons";

type ShoppingListItemRowProps = {
  item: ShoppingListItem;
  requester: Friend | undefined;
  priceComparison: PriceComparison | undefined;
  onToggle: () => void;
  onAddAgain: () => void;
  onRemove: () => void;
};

export default function ShoppingListItemRow({
  item,
  requester,
  priceComparison,
  onToggle,
  onAddAgain,
  onRemove,
}: ShoppingListItemRowProps) {
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
        {priceComparison && !item.is_crossed_off && (
          <span className="shopping-item-price-tip">
            <PriceTagIcon /> Cheapest at {priceComparison.cheapest_store}: {money(priceComparison.cheapest_price)}
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
      {item.is_crossed_off && (
        <button type="button" className="shopping-item-add-again" onClick={onAddAgain}>
          <AddAgainIcon /> <span>Add again</span>
        </button>
      )}
      <button type="button" className="del" aria-label={`Remove ${item.name}`} onClick={onRemove}>
        <CloseIcon />
      </button>
    </li>
  );
}
