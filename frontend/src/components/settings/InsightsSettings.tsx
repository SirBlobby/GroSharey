import { Group } from "../../types/group";
import PriceWatchPanel from "../insights/PriceWatchPanel";
import RecapCard from "../insights/RecapCard";
import "../../styles/insights.css";

type InsightsSettingsProps = {
  groups: Group[];
};

export default function InsightsSettings({ groups }: InsightsSettingsProps) {
  return (
    <div className="card settings-panel">
      <h2>Insights</h2>
      <RecapCard groups={groups} />
      <PriceWatchPanel />
    </div>
  );
}
