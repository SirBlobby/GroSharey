import type { Friend } from "../../types";
import { Group } from "../../types/group";
import SplitListCard from "../history/SplitListCard";

type GroupSplitsProps = {
  group: Group;
  currentUsername: string;
  people: Friend[];
};

export default function GroupSplits({ group, currentUsername, people }: GroupSplitsProps) {
  return (
    <SplitListCard
      title="Group grocery runs"
      emptyText={`No grocery runs with ${group.name} yet. Pick the group when you log a split.`}
      includeSplit={(split) => split.group_id === group.id}
      currentUsername={currentUsername}
      people={people}
    />
  );
}
