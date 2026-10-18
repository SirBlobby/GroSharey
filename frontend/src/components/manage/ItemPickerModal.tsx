import { useEffect, useState } from "react";

import type { Item } from "../../types";
import { money } from "../../utils";
import { CheckIcon } from "../icons";
import "../../styles/modal.css";

type ItemPickerModalProps = {
  personName: string;
  items: Item[];
  initialSelectedIds: string[];
  onDone: (selectedItemIds: string[]) => void;
  onClose: () => void;
};

export default function ItemPickerModal({
  personName,
  items,
  initialSelectedIds,
  onDone,
  onClose,
}: ItemPickerModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function toggleItem(itemId: string) {
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(itemId)) {
        nextIds.delete(itemId);
      } else {
        nextIds.add(itemId);
      }
      return nextIds;
    });
  }

  const areAllSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));

  return (
    <div className="overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="card modal" role="dialog" aria-modal="true" aria-label={`Items for ${personName}`}>
        <h2>Items for {personName}</h2>
        <button
          type="button"
          className="btn item-picker-all"
          onClick={() => setSelectedIds(areAllSelected ? new Set() : new Set(items.map((item) => item.id)))}
        >
          {areAllSelected ? "Clear all" : "Select every item"}
        </button>

        {items.length === 0 && <p className="empty">Add items first.</p>}
        {items.map((item) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={`opt ${isSelected ? "on" : ""}`}
              aria-pressed={isSelected}
              onClick={() => toggleItem(item.id)}
            >
              <span className="item-picker-name">{item.name || "Unnamed item"}</span>
              <span className="item-picker-price">{money(parseFloat(item.price) || 0)}</span>
              <span className="chk">{isSelected && <CheckIcon />}</span>
            </button>
          );
        })}

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn" onClick={() => onDone([...selectedIds])}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
