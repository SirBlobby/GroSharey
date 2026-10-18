import appConfig from "../../../app.json";
import { apiBaseUrl, appBaseUrl } from "../../config/environment";

export default function AppInfoSettings() {
  return (
    <div className="card settings-panel">
      <h2>App Info</h2>
      <p className="description">
        groSharey is a reliable grocery price-splitting app. Scan a receipt, assign items to roommates, and
        everyone sees what they owe.
      </p>

      <dl className="detail-list">
        <dt>Version</dt>
        <dd>{appConfig.expo.version}</dd>
        <dt>Website</dt>
        <dd>{appBaseUrl}</dd>
        <dt>Server</dt>
        <dd>{apiBaseUrl}</dd>
      </dl>
    </div>
  );
}
