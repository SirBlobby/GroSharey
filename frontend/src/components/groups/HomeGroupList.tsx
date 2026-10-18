import { convertProfileToFriend } from "../../services/friends";
import { Group } from "../../types/group";
import Avatar from "../Avatar";
import { GroupsIcon } from "../icons";

type HomeGroupListProps = {
  groups: Group[];
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onNewGroup: () => void;
};

const MAX_AVATARS_SHOWN = 3;

export default function HomeGroupList({ groups, selectedGroupId, onSelectGroup, onNewGroup }: HomeGroupListProps) {
  return (
    <div className="home-groups">
      <h2>Groups</h2>
      {groups.length === 0 && <p className="description home-groups-empty">No groups yet.</p>}
      <div className="flist">
        {groups.map((group) => (
          <button
            key={group.id}
            type="button"
            className={`friend home-group ${group.id === selectedGroupId ? "sel" : ""}`}
            onClick={() => onSelectGroup(group.id)}
          >
            <span className="friend-identity">
              <span className="home-group-icon">
                <GroupsIcon />
              </span>
              <span className="home-group-names">
                <span className="home-group-name">{group.name}</span>
                <span className="home-group-count">{group.members.length} people</span>
              </span>
            </span>
            <span className="home-group-avatars">
              {group.members.slice(0, MAX_AVATARS_SHOWN).map((member) => (
                <Avatar key={member.username} friend={convertProfileToFriend(member)} />
              ))}
            </span>
          </button>
        ))}
      </div>
      <button type="button" className="home-group-new" onClick={onNewGroup}>
        <GroupsIcon /> {groups.length === 0 ? "Make a group" : "Manage groups"}
      </button>
    </div>
  );
}
