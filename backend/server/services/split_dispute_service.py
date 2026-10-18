from datetime import datetime, timezone

from bson import ObjectId

from server.errors import BadRequestError, ConflictError, NotFoundError
from server.models.dispute_models import (
    CreateDisputeRequest,
    ItemDispute,
    ResolveDisputeRequest,
    SplitParticipants,
)
from server.models.split_models import PersonSplit, SavedSplit
from server.models.user_models import User
from server.repositories.split_repository import SplitRepository
from server.services.audit_log_service import AuditLogService
from server.services.audit_messages import describe_store


def to_cents(amount: float) -> int:
    return round(amount * 100)


def remove_item_from_share(person: PersonSplit, item_id: str) -> PersonSplit:
    removed_item = next(item_share for item_share in person.items if item_share.item_id == item_id)
    subtotal_cents = to_cents(person.subtotal) - to_cents(removed_item.price)
    tax_cents = to_cents(person.tax) - to_cents(removed_item.tax)
    total_cents = to_cents(person.total) - to_cents(removed_item.total)
    owes_cents = to_cents(person.owes) - to_cents(removed_item.total)
    return person.model_copy(
        update={
            "items": [item_share for item_share in person.items if item_share.item_id != item_id],
            "subtotal": subtotal_cents / 100,
            "tax": tax_cents / 100,
            "total": total_cents / 100,
            "owes": owes_cents / 100,
        }
    )


class SplitDisputeService:
    def __init__(self, split_repository: SplitRepository, audit_log_service: AuditLogService):
        self.split_repository = split_repository
        self.audit_log_service = audit_log_service

    def find_split_for(self, split_id: str, user: User) -> tuple[SavedSplit, SplitParticipants]:
        participants = self.split_repository.find_participants(split_id)
        saved_split = self.split_repository.find_by_id(split_id)
        if participants is None or saved_split is None:
            raise NotFoundError("Split", split_id)
        allowed_ids = {*participants.user_ids_by_username.values(), participants.payer_id, participants.created_by_id}
        if user.id not in allowed_ids:
            raise NotFoundError("Split", split_id)
        return saved_split, participants

    def dispute_item(self, split_id: str, dispute_request: CreateDisputeRequest, user: User) -> SavedSplit:
        saved_split, participants = self.find_split_for(split_id, user)
        if saved_split.payer == user.username:
            raise BadRequestError("You paid for this split, so there's nothing to dispute")
        person = next((person for person in saved_split.people if person.username == user.username), None)
        your_items = person.items if person else []
        item_share = next((item for item in your_items if item.item_id == dispute_request.item_id), None)
        if item_share is None:
            raise BadRequestError("That item isn't on your share of this split")
        if any(
            dispute.item_id == item_share.item_id and dispute.username == user.username and dispute.status == "open"
            for dispute in saved_split.disputes
        ):
            raise ConflictError("You already said you didn't get this item")

        dispute = ItemDispute(
            id=str(ObjectId()),
            item_id=item_share.item_id,
            item_name=item_share.name,
            username=user.username,
            reason=dispute_request.reason,
            created_at=datetime.now(timezone.utc),
        )
        self.split_repository.add_dispute(split_id, dispute, user.id)
        self.record_dispute(saved_split, participants, dispute, user)
        return self.split_repository.find_by_id(split_id) or saved_split

    def resolve_dispute(
        self, split_id: str, dispute_id: str, resolve_request: ResolveDisputeRequest, user: User
    ) -> SavedSplit:
        saved_split, participants = self.find_split_for(split_id, user)
        if user.id not in (participants.payer_id, participants.created_by_id):
            raise BadRequestError("Only the person who made or paid for this split can settle a dispute")
        dispute = next((dispute for dispute in saved_split.disputes if dispute.id == dispute_id), None)
        if dispute is None:
            raise NotFoundError("Dispute", dispute_id)
        if dispute.status != "open":
            raise ConflictError("This dispute was already settled")

        disputer_id = participants.user_ids_by_username.get(dispute.username)
        person = next((person for person in saved_split.people if person.username == dispute.username), None)
        has_item = person is not None and any(item.item_id == dispute.item_id for item in person.items)
        if resolve_request.resolution == "removed" and person and disputer_id and has_item:
            updated_person = remove_item_from_share(person, dispute.item_id)
            self.split_repository.set_person_share(split_id, disputer_id, updated_person)
        self.split_repository.resolve_dispute(split_id, dispute_id, resolve_request.resolution, user.username)
        if disputer_id:
            self.record_resolution(saved_split, dispute, resolve_request.resolution, disputer_id, user)
        return self.split_repository.find_by_id(split_id) or saved_split

    def record_dispute(
        self, saved_split: SavedSplit, participants: SplitParticipants, dispute: ItemDispute, user: User
    ) -> None:
        description = (
            f"@{user.username} says they didn't get {dispute.item_name} "
            f"from {describe_store(saved_split.store_name)}"
        )
        if dispute.reason:
            description += f": {dispute.reason}"
        self.audit_log_service.record(
            user.id,
            "splits",
            "disputed_item",
            f"You said you didn't get {dispute.item_name} from {describe_store(saved_split.store_name)}",
            user.username,
        )
        for recipient_id in {participants.created_by_id, participants.payer_id} - {user.id}:
            self.audit_log_service.record(
                recipient_id, "splits", "item_disputed", description, user.username, notify=True
            )

    def record_resolution(
        self, saved_split: SavedSplit, dispute: ItemDispute, resolution: str, disputer_id: str, user: User
    ) -> None:
        store = describe_store(saved_split.store_name)
        if resolution == "removed":
            description = f"@{user.username} took {dispute.item_name} off your share of {store}"
        else:
            description = f"@{user.username} kept {dispute.item_name} on your share of {store}"
        self.audit_log_service.record(
            user.id, "splits", "resolved_dispute", f"You settled a dispute about {dispute.item_name}", user.username
        )
        self.audit_log_service.record(
            disputer_id, "splits", "dispute_resolved", description, user.username, notify=True
        )
