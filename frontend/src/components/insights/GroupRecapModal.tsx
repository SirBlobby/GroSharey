import { useEffect } from "react";

import { Group } from "../../types/group";
import { CloseIcon } from "../icons";
import RecapCard from "./RecapCard";
import "../../styles/modal.css";
import "../../styles/settings.css";
import "../../styles/insights.css";

type GroupRecapModalProps = {
  group: Group;
  onClose: () => void;
};

export default function GroupRecapModal({ group, onClose }: GroupRecapModalProps) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="card modal group-recap-modal" role="dialog" aria-modal="true" aria-label={`${group.name} recap`}>
        <div className="assistant-header">
          <h2>{group.name} recap</h2>
          <button type="button" className="assistant-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <RecapCard groups={[group]} fixedGroupId={group.id} />
      </div>
    </div>
  );
}
