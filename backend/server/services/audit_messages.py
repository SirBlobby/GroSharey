def describe_store(store_name: str | None) -> str:
    return store_name or "a grocery run"


def describe_saved_split(store_name: str | None, total: float) -> str:
    return f"Saved a split for {describe_store(store_name)} totaling ${total:.2f}"


def describe_added_to_split(payer_username: str, store_name: str | None, owes: float) -> str:
    return f"@{payer_username} added you to a split for {describe_store(store_name)}, you owe ${owes:.2f}"


def describe_payment(amount_cents: int, from_username: str, to_username: str) -> str:
    return f"${amount_cents / 100:.2f} payment from @{from_username} to @{to_username}"


def describe_scanned_receipt(store_name: str | None) -> str:
    return f"Scanned a receipt from {describe_store(store_name)}"
