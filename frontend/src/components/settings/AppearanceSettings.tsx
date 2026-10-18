import { TextSize } from "../../appearance/appearanceSettings";
import { useAppearance } from "../../hooks/useAppearance";

const TEXT_SIZE_OPTIONS: { value: TextSize; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "large", label: "Large" },
];

export default function AppearanceSettings() {
  const { appearance, updateAppearance } = useAppearance();

  return (
    <div className="card settings-panel">
      <h2>Appearance</h2>

      <div className="settings-group">
        <h3>Text Size</h3>
        <div className="option-row" role="radiogroup" aria-label="Text size">
          {TEXT_SIZE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={appearance.textSize === option.value}
              className={`option-button ${appearance.textSize === option.value ? "selected" : ""}`}
              onClick={() => updateAppearance({ textSize: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <h3>Motion</h3>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={appearance.reduceMotion}
            onChange={(event) => updateAppearance({ reduceMotion: event.target.checked })}
          />
          <span>Reduce animations</span>
        </label>
      </div>
    </div>
  );
}
