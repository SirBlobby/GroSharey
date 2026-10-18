import { convertProfileToFriend } from "../../services/friends";
import type { Friend } from "../../types";
import { Group } from "../../types/group";
import { money } from "../../utils";
import Avatar from "../Avatar";
import { EditIcon, GroupsIcon, ShoppingListIcon } from "../icons";
import BudgetBar from "./BudgetBar";
import TripBanner from "./TripBanner";

type GroupOverviewCardProps = {
  group: Group;
  friends: Friend[];
  currentUsername: string;
  onOpenShoppingList: (listId: string | null) => void;
  onManageGroups: () => void;
  onStartTrip: (groupId: string, store: string) => Promise<void>;
  onEndTrip: (groupId: string) => Promise<void>;
};

function describeBalance(friend: Friend | undefined): { label: string; className: string } {
  if (!friend) {
    return { label: "Not a friend", className: "group-balance--neutral" };
  }
  if (friend.balance < 0) {
    return { label: `You owe ${money(-friend.balance)}`, className: "group-balance--owe" };
  }
  if (friend.balance > 0) {
    return { label: `Owes you ${money(friend.balance)}`, className: "group-balance--owed" };
  }
  return { label: "Settled up", className: "group-balance--settled" };
}

export default function GroupOverviewCard({
  group,
  friends,
  currentUsername,
  onOpenShoppingList,
  onManageGroups,
  onStartTrip,
  onEndTrip,
}: GroupOverviewCardProps) {
  const friendsByUsername = new Map(friends.map((friend) => [friend.username, friend]));
  const otherMembers = group.members.filter((member) => member.username !== currentUsername);

  return (
    <div className="card owe group-overview">
      <div className="group-overview-identity">
        <span className="group-overview-icon">
          <GroupsIcon />
        </span>
        <div className="friend-overview-names">
          <span className="friend-overview-name">{group.name}</span>
          <span className="handle">
            {group.members.length} people - made by{" "}
            {group.owner_username === currentUsername ? "you" : `@${group.owner_username}`}
          </span>
          <div className="group-overview-actions">
            <button
              type="button"
              className="friend-overview-link"
              onClick={() => onOpenShoppingList(group.shopping_list_id)}
            >
              <ShoppingListIcon /> {group.shopping_list_id ? "Shopping list" : "Start a list"}
            </button>
            <button type="button" className="friend-overview-link" onClick={onManageGroups}>
              <EditIcon /> Manage
            </button>
          </div>
        </div>
      </div>

      <ul className="group-balances">
        {otherMembers.map((member) => {
          const friend = friendsByUsername.get(member.username);
          const balance = describeBalance(friend);
          return (
            <li key={member.username} className="group-balance">
              <Avatar friend={friend ?? convertProfileToFriend(member)} />
              <span className="group-balance-name">{member.display_name}</span>
              <span className={`group-balance-amount ${balance.className}`}>{balance.label}</span>
            </li>
          );
        })}
      </ul>

      <BudgetBar group={group} />
      <TripBanner group={group} currentUsername={currentUsername} onStartTrip={onStartTrip} onEndTrip={onEndTrip} />
    </div>
  );
}
