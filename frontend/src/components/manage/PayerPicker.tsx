import type { Friend } from "../../types";
import Avatar from "../Avatar";
import { CheckIcon } from "../icons";

type PayerPickerProps = {
  people: Friend[];
  payerUsername: string;
  onPayerChange: (username: string) => void;
};

export default function PayerPicker({ people, payerUsername, onPayerChange }: PayerPickerProps) {
  return (
    <div className="summary-section">
      <h3>Paid at the store by</h3>
      <div className="payer-options" role="radiogroup" aria-label="Who paid at the store">
        {people.map((person) => {
          const isPayer = person.username === payerUsername;
          return (
            <button
              key={person.username}
              type="button"
              role="radio"
              aria-checked={isPayer}
              className={`payer-option ${isPayer ? "selected" : ""}`}
              onClick={() => onPayerChange(person.username)}
            >
              <Avatar friend={person} />
              <span className="payer-option-name">{person.name}</span>
              {isPayer && <CheckIcon />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
