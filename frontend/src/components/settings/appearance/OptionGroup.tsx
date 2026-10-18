import type { Option } from "./appearanceOptions";

type OptionGroupProps<Value extends string> = {
  label: string;
  options: Option<Value>[];
  selectedValue: Value;
  onSelect: (value: Value) => void;
};

export default function OptionGroup<Value extends string>({
  label,
  options,
  selectedValue,
  onSelect,
}: OptionGroupProps<Value>) {
  return (
    <div className="option-row" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={selectedValue === option.value}
          aria-label={option.ariaLabel}
          className={`option-button ${selectedValue === option.value ? "selected" : ""}`}
          onClick={() => onSelect(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
