import { ItemDispute } from "../../types/split";
import { DisputeIcon } from "../icons";

type DisputeReviewListProps = {
  disputes: ItemDispute[];
  isSending: boolean;
  findName: (username: string) => string;
  onResolve: (disputeId: string, resolution: "dismissed" | "removed") => void;
};

export default function DisputeReviewList({ disputes, isSending, findName, onResolve }: DisputeReviewListProps) {
  const openDisputes = disputes.filter((dispute) => dispute.status === "open");
  if (openDisputes.length === 0) {
    return null;
  }

  return (
    <div className="dispute-review">
      <h3>
        <DisputeIcon /> Needs your review
      </h3>
      <ul className="dispute-review-list">
        {openDisputes.map((dispute) => (
          <li key={dispute.id} className="dispute-review-item">
            <p className="dispute-review-text">
              {findName(dispute.username)} says they didn't get <strong>{dispute.item_name}</strong>
              {dispute.reason && <span className="dispute-review-reason">"{dispute.reason}"</span>}
            </p>
            <div className="dispute-review-actions">
              <button
                type="button"
                className="history-button"
                disabled={isSending}
                onClick={() => onResolve(dispute.id, "removed")}
              >
                Take it off their share
              </button>
              <button
                type="button"
                className="history-button"
                disabled={isSending}
                onClick={() => onResolve(dispute.id, "dismissed")}
              >
                Keep it
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
