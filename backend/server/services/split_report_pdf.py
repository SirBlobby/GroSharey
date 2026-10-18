from datetime import datetime

from fpdf import FPDF

from server.models.report_models import SplitReport, SplitReportRow

FOREST_GREEN = (42, 97, 0)
MINT = (219, 250, 207)
NAVY = (26, 24, 86)
SUMMARY_COLUMN_WIDTHS = (28, 62, 34, 28, 28)
SUMMARY_HEADINGS = ("Date", "Store", "Paid by", "Total", "Your share")


def make_printable(text: str) -> str:
    return text.encode("latin-1", "replace").decode("latin-1")


def describe_date(row: SplitReportRow) -> str:
    if row.split.purchase_date:
        try:
            return f"{datetime.strptime(row.split.purchase_date, '%Y-%m-%d'):%b %d, %Y}"
        except ValueError:
            pass
    return f"{row.split.created_at:%b %d, %Y}"


class SplitReportPdf(FPDF):
    def header(self) -> None:
        self.set_fill_color(*FOREST_GREEN)
        self.rect(0, 0, self.w, 18, style="F")
        self.set_text_color(255, 255, 255)
        self.set_font("Helvetica", "B", 16)
        self.set_xy(10, 5)
        self.cell(0, 8, "groSharey")
        self.set_text_color(*NAVY)
        self.set_y(24)

    def footer(self) -> None:
        self.set_y(-12)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 6, f"Page {self.page_no()}", align="C")


def write_summary(pdf: SplitReportPdf, report: SplitReport) -> None:
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 9, make_printable(f"Grocery report for {report.month_label}"), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 6, make_printable(f"{report.display_name} (@{report.username})"), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)
    for label, amount in (
        ("Grocery runs", None),
        ("Total of all receipts", report.total_spent),
        ("Your share", report.your_share_total),
        ("You paid at the store", report.you_paid_total),
    ):
        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(55, 7, label)
        pdf.set_font("Helvetica", "", 11)
        value = str(len(report.rows)) if amount is None else f"${amount:.2f}"
        pdf.cell(0, 7, value, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)


def write_split_table(pdf: SplitReportPdf, report: SplitReport) -> None:
    pdf.set_fill_color(*MINT)
    pdf.set_font("Helvetica", "B", 10)
    for heading, width in zip(SUMMARY_HEADINGS, SUMMARY_COLUMN_WIDTHS):
        pdf.cell(width, 8, heading, border=1, fill=True)
    pdf.ln()
    pdf.set_font("Helvetica", "", 10)
    for row in report.rows:
        values = (
            describe_date(row),
            (row.split.store_name or "Grocery run")[:34],
            "You" if row.you_paid_store else f"@{row.split.payer}"[:18],
            f"${row.split.total:.2f}",
            f"${row.your_share:.2f}",
        )
        for value, width in zip(values, SUMMARY_COLUMN_WIDTHS):
            pdf.cell(width, 7, make_printable(value), border=1)
        pdf.ln()
    pdf.ln(6)


def write_split_details(pdf: SplitReportPdf, report: SplitReport) -> None:
    for row in report.rows:
        your_part = next((person for person in row.split.people if person.username == report.username), None)
        if your_part is None or not your_part.items:
            continue
        pdf.set_font("Helvetica", "B", 11)
        title = f"{row.split.store_name or 'Grocery run'} - {describe_date(row)}"
        pdf.cell(0, 7, make_printable(title), new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 10)
        for item_share in your_part.items:
            pdf.cell(150, 6, make_printable(f"  {item_share.name}"[:80]))
            pdf.cell(0, 6, f"${item_share.total:.2f}", align="R", new_x="LMARGIN", new_y="NEXT")
        if your_part.tip:
            pdf.cell(150, 6, "  Tip")
            pdf.cell(0, 6, f"${your_part.tip:.2f}", align="R", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(150, 6, "  Your total")
        pdf.cell(0, 6, f"${your_part.total:.2f}", align="R", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)


def render_split_report(report: SplitReport) -> bytes:
    pdf = SplitReportPdf()
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.add_page()
    write_summary(pdf, report)
    if not report.rows:
        pdf.set_font("Helvetica", "", 11)
        pdf.cell(0, 8, "No grocery runs this month.")
        return bytes(pdf.output())
    write_split_table(pdf, report)
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 9, "Your items", new_x="LMARGIN", new_y="NEXT")
    write_split_details(pdf, report)
    return bytes(pdf.output())
