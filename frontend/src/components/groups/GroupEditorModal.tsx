import { FormEvent, useEffect, useState } from "react";

import { convertProfileToFriend } from "../../services/friends";
import type { Friend } from "../../types";
import { Group, GroupRequest } from "../../types/group";
import { readErrorMessage } from "../../utils";
import Avatar from "../Avatar";
import { CheckIcon } from "../icons";
import "../../styles/modal.css";

type GroupEditorModalProps = {
  group: Group | null;
  friends: Friend[];
  currentUsername: string;
  onSave: (groupRequest: GroupRequest) => Promise<unknown>;
  onClose: () => void;
};

function listChoosablePeople(group: Group | null, friends: Friend[], currentUsername: string): Friend[] {
  const currentMembers = (group?.members ?? []).map(convertProfileToFriend);
  const people = new Map([...friends, ...currentMembers].map((person) => [person.username, person]));
  people.delete(currentUsername);
  return [...people.values()].sort((first, second) => first.name.localeCompare(second.name));
}

export default function GroupEditorModal({ group, friends, currentUsername, onSave, onClose }: GroupEditorModalProps) {
  const [groupName, setGroupName] = useState(group?.name ?? "");
  const [selectedUsernames, setSelectedUsernames] = useState<Set<string>>(
    new Set((group?.members ?? []).map((member) => member.username).filter((username) => username !== currentUsername)),
  );
  const [monthlyBudget, setMonthlyBudget] = useState(group?.monthly_budget ? String(group.monthly_budget) : "");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const choosablePeople = listChoosablePeople(group, friends, currentUsername);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function togglePerson(username: string) {
    setSelectedUsernames((currentUsernames) => {
      const nextUsernames = new Set(currentUsernames);
      if (nextUsernames.has(username)) {
        nextUsernames.delete(username);
      } else {
        nextUsernames.add(username);
      }
      return nextUsernames;
    });
  }

  async function saveGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const budgetAmount = parseFloat(monthlyBudget);
      await onSave({
        name: groupName.trim(),
        member_usernames: [...selectedUsernames],
        monthly_budget: budgetAmount > 0 ? budgetAmount : null,
      });
      onClose();
    } catch (error) {
      setErrorMessage(readErrorMessage(error, "Couldn't save this group"));
    } finally {
      setIsSaving(false);
    }
  }

  const title = group ? `Edit ${group.name}` : "New group";
  const canSave = groupName.trim().length > 0 && selectedUsernames.size > 0 && !isSaving;

  return (
    <div className="overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <form className="card modal group-editor" role="dialog" aria-modal="true" aria-label={title} onSubmit={saveGroup}>
        <h2>{title}</h2>
        <label className="group-editor-name">
          Group name
          <input
            value={groupName}
            maxLength={50}
            placeholder="Apartment 4B"
            onChange={(event) => setGroupName(event.target.value)}
          />
        </label>

        <label className="group-editor-name">
          Monthly grocery budget (optional)
          <input
            value={monthlyBudget}
            inputMode="decimal"
            placeholder="400.00"
            onChange={(event) => setMonthlyBudget(event.target.value)}
          />
        </label>

        <h3 className="group-editor-heading">Members</h3>
        {choosablePeople.length === 0 && <p className="empty">Add friends first, then make a group with them.</p>}
        {choosablePeople.map((person) => {
          const isSelected = selectedUsernames.has(person.username);
          return (
            <button
              key={person.username}
              type="button"
              className={`opt ${isSelected ? "on" : ""}`}
              aria-pressed={isSelected}
              onClick={() => togglePerson(person.username)}
            >
              <Avatar friend={person} />
              {person.name}
              <span className="chk">{isSelected && <CheckIcon />}</span>
            </button>
          );
        })}

        {errorMessage && <p className="error-text">{errorMessage}</p>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn" disabled={!canSave}>
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
