import type { Friend } from "../../types";
import SplitListCard from "../history/SplitListCard";

type SharedSplitsProps = {
  friendUsername: string;
  friendName: string;
  currentUsername: string;
  people: Friend[];
};

export default function SharedSplits({ friendUsername, friendName, currentUsername, people }: SharedSplitsProps) {
  return (
    <SplitListCard
      title="Grocery runs together"
      emptyText={`No grocery runs with ${friendName} yet.`}
      includeSplit={(split) =>
        split.payer === friendUsername || split.people.some((person) => person.username === friendUsername)
      }
      focusUsername={friendUsername}
      currentUsername={currentUsername}
      people={people}
    />
  );
}
