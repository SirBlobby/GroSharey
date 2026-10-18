from datetime import datetime, timezone

from server.errors import BadRequestError
from server.models.group_models import Group, StartTripRequest, StoredGroup, StoredTrip
from server.models.user_models import User
from server.repositories.group_repository import GroupRepository
from server.services.audit_log_service import AuditLogService
from server.services.group_service import GroupService, is_trip_active


class GroupTripService:
    def __init__(
        self, group_service: GroupService, group_repository: GroupRepository, audit_log_service: AuditLogService
    ):
        self.group_service = group_service
        self.group_repository = group_repository
        self.audit_log_service = audit_log_service

    def start_trip(self, group_id: str, trip_request: StartTripRequest, shopper: User) -> Group:
        stored_group = self.group_service.get_group_for_member(group_id, shopper.id)
        active_trip = stored_group.active_trip
        if is_trip_active(active_trip) and active_trip and active_trip.shopper_id != shopper.id:
            raise BadRequestError("Someone in this group is already out shopping")
        trip = StoredTrip(shopper_id=shopper.id, store=trip_request.store, started_at=datetime.now(timezone.utc))
        self.group_repository.set_active_trip(group_id, trip)
        self.audit_log_service.record(
            shopper.id,
            "groups",
            "started_trip",
            f"You started a trip to {trip.store} for {stored_group.name}",
            shopper.username,
        )
        self.group_service.notify_members(
            stored_group.member_ids,
            shopper,
            "started_trip",
            f"@{shopper.username} is going to {trip.store}. Add anything {stored_group.name} needs to the list.",
        )
        return self.group_service.get_group(group_id, shopper)

    def end_trip(self, group_id: str, user: User) -> Group:
        stored_group = self.group_service.get_group_for_member(group_id, user.id)
        active_trip = stored_group.active_trip
        if active_trip and user.id not in (active_trip.shopper_id, stored_group.owner_id):
            raise BadRequestError("Only the shopper can end this trip")
        self.group_repository.set_active_trip(group_id, None)
        return self.group_service.get_group(group_id, user)

    def end_trip_after_split(self, stored_group: StoredGroup, shopper: User) -> None:
        active_trip = stored_group.active_trip
        if active_trip and active_trip.shopper_id == shopper.id:
            self.group_repository.set_active_trip(stored_group.id, None)
