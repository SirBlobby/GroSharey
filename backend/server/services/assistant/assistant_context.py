from dataclasses import dataclass

from server.models.user_models import User
from server.services.friend_service import FriendService
from server.services.group_service import GroupService
from server.services.group_trip_service import GroupTripService
from server.services.pantry_service import PantryService
from server.services.payment_reminder_service import PaymentReminderService
from server.services.payment_service import PaymentService
from server.services.shopping_list_service import ShoppingListService
from server.services.split_dispute_service import SplitDisputeService
from server.services.split_service import SplitService


@dataclass
class AssistantServices:
    shopping_list_service: ShoppingListService
    pantry_service: PantryService
    group_service: GroupService
    group_trip_service: GroupTripService
    friend_service: FriendService
    payment_service: PaymentService
    payment_reminder_service: PaymentReminderService
    split_service: SplitService
    split_dispute_service: SplitDisputeService


@dataclass
class AssistantContext:
    user: User
    services: AssistantServices
    changed_data: bool = False
