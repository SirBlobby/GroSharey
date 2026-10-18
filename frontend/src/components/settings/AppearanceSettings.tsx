import { useAppearance } from "../../hooks/useAppearance";
import { COLOR_MODE_OPTIONS, TEXT_SIZE_OPTIONS } from "./appearance/appearanceOptions";
import OptionGroup from "./appearance/OptionGroup";

export default function AppearanceSettings() {
  const { appearance, updateAppearance } = useAppearance();

  return (
    <div className="card settings-panel">
      <h2>Appearance</h2>

      <div className="settings-group">
        <h3>Dark Mode</h3>
        <OptionGroup
          label="Dark mode"
          options={COLOR_MODE_OPTIONS}
          selectedValue={appearance.colorMode}
          onSelect={(colorMode) => updateAppearance({ colorMode })}
        />
      </div>

      <div className="settings-group">
        <h3>Accessibility</h3>
        <p className="description">Text size</p>
        <OptionGroup
          label="Text size"
          options={TEXT_SIZE_OPTIONS}
          selectedValue={appearance.textSize}
          onSelect={(textSize) => updateAppearance({ textSize })}
        />
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={appearance.highContrast}
            onChange={(event) => updateAppearance({ highContrast: event.target.checked })}
          />
          <span>High contrast</span>
        </label>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={appearance.reduceMotion}
            onChange={(event) => updateAppearance({ reduceMotion: event.target.checked })}
          />
          <span>Reduce motion</span>
        </label>
      </div>
    </div>
  );
}
