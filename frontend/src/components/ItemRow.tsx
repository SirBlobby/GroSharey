import type { Item } from '../types';
import { formatPrice } from '../utils';
import { CloseIcon } from './icons';

interface Props {
  item: Item;
  autoFocus?: boolean;
  onChange: (patch: Partial<Item>) => void;
  onDelete: () => void;
}

export default function ItemRow({ item, autoFocus, onChange, onDelete }: Props) {
  return (
    <div className="row">
      <input
        className="name"
        value={item.name}
        placeholder="Item name"
        aria-label="Item name"
        autoFocus={autoFocus}
        onChange={(e) => onChange({ name: e.target.value })}
      />
      <div className="price-wrap">
        <span>$</span>
        <input
          value={item.price}
          inputMode="decimal"
          placeholder="0.00"
          aria-label="Price"
          onChange={(e) => onChange({ price: e.target.value })}
          onBlur={(e) => onChange({ price: formatPrice(e.target.value) })}
        />
      </div>
      <button type="button" className="del" aria-label="Remove item" onClick={onDelete}><CloseIcon /></button>
    </div>
  );
}
