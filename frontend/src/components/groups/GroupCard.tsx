import { convertProfileToFriend } from "../../services/friends";
import { Group } from "../../types/group";
import Avatar from "../Avatar";
import { DeleteIcon, EditIcon, LogOutIcon, ShoppingListIcon } from "../icons";
import BudgetBar from "./BudgetBar";

type GroupCardProps = {
  group: Group;
  currentUsername: string;
  onEdit: () => void;
  onDelete: () => void;
  onLeave: () => void;
  onOpenShoppingList: () => void;
};

export default function GroupCard({
  group,
  currentUsername,
  onEdit,
  onDelete,
  onLeave,
  onOpenShoppingList,
}: GroupCardProps) {
  const isOwner = group.owner_username === currentUsername;

  return (
    <li className="group-card">
      <div className="group-card-top">
        <div className="group-card-names">
          <span className="group-card-name">{group.name}</span>
          <span className="handle">
            {isOwner ? "You made this group" : `Made by @${group.owner_username}`} - {group.members.length} people
          </span>
        </div>
        <button type="button" className="group-action" onClick={onOpenShoppingList}>
          <ShoppingListIcon /> {group.shopping_list_id ? "Shopping list" : "Start a list"}
        </button>
      </div>

      <ul className="group-members">
        {group.members.map((member) => (
          <li key={member.username} className="group-member">
            <Avatar friend={convertProfileToFriend(member)} />
            <span>{member.username === currentUsername ? "You" : member.display_name}</span>
          </li>
        ))}
      </ul>

      <BudgetBar group={group} />

      <div className="group-card-actions">
        {isOwner ? (
          <>
            <button type="button" className="group-action" onClick={onEdit}>
              <EditIcon /> Edit
            </button>
            <button type="button" className="group-action group-action--danger" onClick={onDelete}>
              <DeleteIcon /> Delete
            </button>
          </>
        ) : (
          <button type="button" className="group-action group-action--danger" onClick={onLeave}>
            <LogOutIcon /> Leave
          </button>
        )}
      </div>
    </li>
  );
}
