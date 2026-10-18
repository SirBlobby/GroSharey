from server.errors import BadRequestError

SPEAKER_WORDS = {"", "me", "i", "myself", "mine", "you", "us"}
LIST_FILLER_WORDS = {"the", "list", "shopping", "group", "our", "my"}


def normalize(text: str | None) -> str:
    return " ".join((text or "").lower().replace("'s", "").split())


def names_match(spoken_name: str | None, stored_name: str | None) -> bool:
    spoken = normalize(spoken_name)
    stored = normalize(stored_name)
    return bool(spoken) and bool(stored) and (spoken == stored or spoken in stored or stored in spoken)


def remove_filler_words(name: str | None) -> str:
    return " ".join(word for word in normalize(name).split() if word not in LIST_FILLER_WORDS)


def list_names_match(spoken_name: str | None, stored_name: str | None) -> bool:
    return names_match(remove_filler_words(spoken_name), remove_filler_words(stored_name))


def person_matches(spoken_name: str | None, username: str, display_name: str) -> bool:
    first_name = display_name.split(" ")[0]
    return any(names_match(spoken_name, name) for name in (username, display_name, first_name))


def is_speaker(spoken_name: str | None) -> bool:
    return normalize(spoken_name) in SPEAKER_WORDS


def pick_one[Choice](matches: list[Choice], spoken_name: str, kind: str, all_names: list[str]) -> Choice:
    if len(matches) == 1:
        return matches[0]
    if not matches:
        raise BadRequestError(f"No {kind} matches '{spoken_name}'. Options: {', '.join(all_names) or 'none'}")
    raise BadRequestError(f"More than one {kind} matches '{spoken_name}'. Ask which one: {', '.join(all_names)}")


def needs_confirmation(action: str) -> dict:
    instruction = f"Ask the speaker to confirm: {action}. Call again with confirmed true if they agree."
    return {"needs_confirmation": instruction}
