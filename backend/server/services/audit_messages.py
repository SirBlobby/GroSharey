def describe_store(store_name: str | None) -> str:
    return store_name or "a grocery run"


def describe_saved_split(store_name: str | None, total: float) -> str:
    return f"Saved a split for {describe_store(store_name)} totaling ${total:.2f}"


def describe_added_to_split(creator_username: str, store_name: str | None, owes: float, payer_username: str) -> str:
    added_text = f"@{creator_username} added you to a split for {describe_store(store_name)}"
    if owes == 0:
        return f"{added_text}, you're all paid up"
    if owes < 0:
        return f"{added_text}, you overpaid and are owed ${-owes:.2f} back"
    if payer_username == creator_username:
        return f"{added_text}, you owe ${owes:.2f}"
    return f"{added_text}, you owe @{payer_username} ${owes:.2f}"


def describe_recorded_as_payer(creator_username: str, store_name: str | None, total: float) -> str:
    return f"@{creator_username} recorded that you paid ${total:.2f} for {describe_store(store_name)}"


def describe_payment(amount_cents: int, from_username: str, to_username: str) -> str:
    return f"${amount_cents / 100:.2f} payment from @{from_username} to @{to_username}"


def describe_scanned_receipt(store_name: str | None) -> str:
    return f"Scanned a receipt from {describe_store(store_name)}"
