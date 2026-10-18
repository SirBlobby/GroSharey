import { Group } from "../../types/group";
import { money } from "../../utils";
import "../../styles/groups.css";

type BudgetBarProps = {
  group: Group;
};

function describeBudgetLevel(spentShare: number): string {
  if (spentShare >= 1) {
    return "budget-bar--over";
  }
  if (spentShare >= 0.8) {
    return "budget-bar--close";
  }
  return "";
}

export default function BudgetBar({ group }: BudgetBarProps) {
  if (!group.monthly_budget) {
    return null;
  }
  const spentShare = group.month_spent / group.monthly_budget;
  const remaining = group.monthly_budget - group.month_spent;

  return (
    <div className={`budget-bar ${describeBudgetLevel(spentShare)}`}>
      <div className="budget-bar-labels">
        <span>
          {money(group.month_spent)} of {money(group.monthly_budget)} this month
        </span>
        <span>{remaining >= 0 ? `${money(remaining)} left` : `${money(-remaining)} over`}</span>
      </div>
      <div
        className="budget-bar-track"
        role="progressbar"
        aria-label="Monthly budget used"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(Math.min(spentShare, 1) * 100)}
      >
        <div className="budget-bar-fill" style={{ width: `${Math.min(spentShare, 1) * 100}%` }} />
      </div>
    </div>
  );
}
