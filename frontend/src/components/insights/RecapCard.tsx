import { useState } from "react";

import { useDeviceActions } from "../../context/DeviceActionsContext";
import { useYearlyRecap } from "../../hooks/useYearlyRecap";
import { drawRecapImage } from "../../media/recapImage";
import { readBase64, shareImageInBrowser } from "../../media/shareImage";
import { Group } from "../../types/group";
import { money, readErrorMessage } from "../../utils";
import { RecapIcon, ShareIcon } from "../icons";

type RecapCardProps = {
  groups: Group[];
  fixedGroupId?: string;
};

const FIRST_RECAP_YEAR = 2024;

function listYears(): number[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - FIRST_RECAP_YEAR + 1 }, (_, yearIndex) => currentYear - yearIndex);
}

export default function RecapCard({ groups, fixedGroupId }: RecapCardProps) {
  const { shareImage } = useDeviceActions();
  const [year, setYear] = useState(new Date().getFullYear());
  const [groupId, setGroupId] = useState<string | null>(fixedGroupId ?? null);
  const { recap, isLoading, errorMessage } = useYearlyRecap(year, groupId);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  async function shareRecap() {
    if (!recap) {
      return;
    }
    setIsSharing(true);
    setShareMessage(null);
    try {
      const imageDataUrl = await drawRecapImage(recap);
      const fileName = `grosharey-recap-${recap.year}.png`;
      if (shareImage && (await shareImage(readBase64(imageDataUrl), fileName))) {
        return;
      }
      const shareResult = await shareImageInBrowser(imageDataUrl, fileName, `groSharey ${recap.year} recap`);
      if (shareResult === "downloaded") {
        setShareMessage("Saved the recap card as an image.");
      }
    } catch (error) {
      setShareMessage(readErrorMessage(error, "Couldn't make the recap card"));
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <div className="settings-group insights-group">
      <h3>
        <RecapIcon /> Yearly Recap
      </h3>
      <div className="recap-controls">
        <select value={year} aria-label="Year" onChange={(event) => setYear(Number(event.target.value))}>
          {listYears().map((recapYear) => (
            <option key={recapYear} value={recapYear}>
              {recapYear}
            </option>
          ))}
        </select>
        {!fixedGroupId && (
          <select
            value={groupId ?? ""}
            aria-label="Whose recap"
            onChange={(event) => setGroupId(event.target.value || null)}
          >
            <option value="">Just me</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading && <p className="description">Adding up your year...</p>}
      {errorMessage && <p className="error-text">{errorMessage}</p>}
      {recap && !isLoading && (
        <div className="recap-card">
          <p className="recap-headline">{recap.headline}</p>
          <dl className="recap-stats">
            <div className="recap-stat">
              <dt>grocery runs</dt>
              <dd>{recap.grocery_runs}</dd>
            </div>
            <div className="recap-stat">
              <dt>items bought</dt>
              <dd>{recap.items_bought}</dd>
            </div>
            <div className="recap-stat">
              <dt>spent together</dt>
              <dd>{money(recap.total_spent)}</dd>
            </div>
            <div className="recap-stat">
              <dt>your share</dt>
              <dd>{money(recap.your_share)}</dd>
            </div>
          </dl>
          {recap.top_products.length > 0 && (
            <ol className="recap-top">
              {recap.top_products.map((item) => (
                <li key={item.product}>
                  {item.product} <span>{item.count}x</span>
                </li>
              ))}
            </ol>
          )}
          {recap.members.length > 0 && (
            <table className="price-table recap-members">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Share</th>
                  <th>Runs paid</th>
                  <th>Top buy</th>
                </tr>
              </thead>
              <tbody>
                {recap.members.map((member) => (
                  <tr key={member.username}>
                    <td>{member.name}</td>
                    <td>{money(member.share)}</td>
                    <td>{member.runs_paid}</td>
                    <td>{member.top_product ?? "none yet"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="recap-favorites">
            {recap.top_stores[0] && <span>Favorite store: {recap.top_stores[0].store}</span>}
            {recap.shopping_buddy && <span>Shopping buddy: {recap.shopping_buddy.name}</span>}
            {recap.biggest_run && (
              <span>
                Biggest run: {money(recap.biggest_run.total)} at {recap.biggest_run.store}
              </span>
            )}
          </p>
          <button
            type="button"
            className="btn recap-share"
            disabled={isSharing || recap.grocery_runs === 0}
            onClick={shareRecap}
          >
            <ShareIcon /> {isSharing ? "Making card..." : "Share recap card"}
          </button>
          {shareMessage && <p className="status-text">{shareMessage}</p>}
        </div>
      )}
    </div>
  );
}
