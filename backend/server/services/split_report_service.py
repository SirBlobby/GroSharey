from server.models.report_models import SplitReport, SplitReportQuery, SplitReportRow
from server.models.user_models import User
from server.repositories.split_repository import SplitRepository
from server.services.split_report_pdf import render_split_report


class SplitReportService:
    def __init__(self, split_repository: SplitRepository):
        self.split_repository = split_repository

    def build_report(self, report_query: SplitReportQuery, user: User) -> SplitReport:
        start, end = report_query.find_month_range()
        splits = self.split_repository.list_for_user_between(user.id, start, end)
        rows = []
        for split in splits:
            your_part = next((person for person in split.people if person.username == user.username), None)
            rows.append(
                SplitReportRow(
                    split=split,
                    your_share=your_part.total if your_part else 0,
                    you_paid_store=split.payer == user.username,
                )
            )
        return SplitReport(
            month_label=f"{start:%B %Y}",
            display_name=user.display_name,
            username=user.username,
            rows=rows,
            total_spent=round(sum(row.split.total for row in rows), 2),
            your_share_total=round(sum(row.your_share for row in rows), 2),
            you_paid_total=round(sum(row.split.total for row in rows if row.you_paid_store), 2),
        )

    def export_pdf(self, report_query: SplitReportQuery, user: User) -> bytes:
        return render_split_report(self.build_report(report_query, user))
