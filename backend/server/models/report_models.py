from datetime import datetime, timezone

from pydantic import BaseModel, Field

from server.models.split_models import SavedSplit


class SplitReportQuery(BaseModel):
    month: str = Field(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")

    def find_month_range(self) -> tuple[datetime, datetime]:
        year, month = (int(part) for part in self.month.split("-"))
        start = datetime(year, month, 1, tzinfo=timezone.utc)
        next_year, next_month = (year + 1, 1) if month == 12 else (year, month + 1)
        return start, datetime(next_year, next_month, 1, tzinfo=timezone.utc)


class SplitReportRow(BaseModel):
    split: SavedSplit
    your_share: float
    you_paid_store: bool


class SplitReport(BaseModel):
    month_label: str
    display_name: str
    username: str
    rows: list[SplitReportRow]
    total_spent: float
    your_share_total: float
    you_paid_total: float
