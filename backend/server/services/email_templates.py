from dataclasses import dataclass, field
from functools import lru_cache
from html import escape
from pathlib import Path

from server.services.email_service import InlineImage

FOREST_GREEN = "#2a6100"
GROCERY_GREEN = "#47a152"
MINT = "#dbfacf"
NAVY = "#1a1856"
DANGER_RED = "#b00000"
INFO_BLUE = "#1d5fbf"
FONT_STACK = "'Josefin Sans', 'Segoe UI', Helvetica, Arial, sans-serif"
LOGO_CONTENT_ID = "grosharey-logo"
LOGO_PATH = Path(__file__).resolve().parent.parent / "assets" / "email_logo.png"


def solid_background(color: str) -> str:
    return f"background-color:{color};background-image:linear-gradient({color},{color});"


LIGHT_MODE_STYLES = f"""
    :root {{ color-scheme: light only; supported-color-schemes: light; }}
    u + .body .light-text {{ color: {NAVY} !important; }}
    u + .body .light-heading {{ color: {FOREST_GREEN} !important; }}
    u + .body .light-white {{ color: #ffffff !important; }}
    [data-ogsc] .light-text {{ color: {NAVY} !important; }}
    [data-ogsc] .light-heading {{ color: {FOREST_GREEN} !important; }}
    [data-ogsc] .light-white {{ color: #ffffff !important; }}
    [data-ogsb] .light-card {{ background-color: {MINT} !important; }}
    [data-ogsb] .light-dark {{ background-color: {FOREST_GREEN} !important; }}
    [data-ogsb] .light-page {{ background-color: {GROCERY_GREEN} !important; }}
"""


@lru_cache
def read_logo_image() -> InlineImage:
    return InlineImage(content_id=LOGO_CONTENT_ID, data=LOGO_PATH.read_bytes())


@dataclass
class EmailLine:
    label: str
    amount: str


@dataclass
class EmailContent:
    preview_text: str
    greeting: str
    heading: str
    paragraphs: list[str]
    button_label: str
    button_url: str
    amount_label: str | None = None
    amount: str | None = None
    amount_color: str = DANGER_RED
    lines: list[EmailLine] = field(default_factory=list)
    footnote: str | None = None


def render_amount(email_content: EmailContent) -> str:
    if not email_content.amount:
        return ""
    return f"""
          <tr><td align="center" style="padding:8px 32px 4px;">
            <div class="light-text" style="font:600 14px {FONT_STACK};color:{NAVY};opacity:0.75;text-transform:uppercase;letter-spacing:1px;">
              {escape(email_content.amount_label or "")}
            </div>
            <div style="font:700 44px {FONT_STACK};color:{email_content.amount_color};line-height:1.2;">
              {escape(email_content.amount)}
            </div>
          </td></tr>"""


def render_lines(email_content: EmailContent) -> str:
    if not email_content.lines:
        return ""
    rows = "".join(
        f"""
              <tr>
                <td style="padding:10px 14px;border-top:2px solid {MINT};font:600 15px {FONT_STACK};color:{NAVY};" class="light-text">
                  {escape(line.label)}
                </td>
                <td align="right" style="padding:10px 14px;border-top:2px solid {MINT};font:600 15px {FONT_STACK};color:{NAVY};white-space:nowrap;" class="light-text">
                  {escape(line.amount)}
                </td>
              </tr>"""
        for line in email_content.lines
    )
    return f"""
          <tr><td style="padding:12px 32px 4px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
              bgcolor="#ffffff"
              style="{solid_background("#ffffff")}border:3px solid {GROCERY_GREEN};border-radius:10px;border-collapse:separate;">
              {rows}
            </table>
          </td></tr>"""


def render_email(email_content: EmailContent, app_url: str) -> str:
    paragraphs = "".join(
        f'<p class="light-text" style="margin:0 0 12px;font:400 16px/1.5 {FONT_STACK};color:{NAVY};">'
        f"{escape(paragraph)}</p>"
        for paragraph in email_content.paragraphs
    )
    footnote = (
        f'<p class="light-text" style="margin:16px 0 0;font:400 13px/1.5 {FONT_STACK};color:{NAVY};opacity:0.7;">'
        f"{escape(email_content.footnote)}</p>"
        if email_content.footnote
        else ""
    )
    background_url = escape(f"{app_url}/background-doodles.png")
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light" />
  <style>{LIGHT_MODE_STYLES}</style>
  <title>{escape(email_content.heading)}</title>
</head>
<body class="body" style="margin:0;padding:0;{solid_background(GROCERY_GREEN)}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{escape(email_content.preview_text)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="{GROCERY_GREEN}" class="light-page">
    <tr><td align="center" valign="top" bgcolor="{GROCERY_GREEN}" background="{background_url}"
      style="padding:28px 12px;background:{GROCERY_GREEN} url({background_url}) center top / cover no-repeat;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
        <tr><td align="center" style="padding:0 0 18px;">
          <table role="presentation" cellpadding="0" cellspacing="0" bgcolor="{FOREST_GREEN}"
            class="light-dark" style="{solid_background(FOREST_GREEN)}border-radius:14px;border:3px solid {NAVY};">
            <tr>
              <td style="padding:8px 4px 8px 14px;">
                <img src="cid:{LOGO_CONTENT_ID}" width="56" height="54" alt="groSharey logo"
                  style="display:block;border:0;" />
              </td>
              <td style="padding:8px 18px 8px 8px;font:700 30px {FONT_STACK};color:#ffffff;" class="light-white">groSharey</td>
            </tr>
          </table>
        </td></tr>
        <tr><td class="light-card" bgcolor="{MINT}"
          style="{solid_background(MINT)}border:5px solid {FOREST_GREEN};border-radius:14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:28px 32px 6px;">
              <p class="light-text" style="margin:0 0 6px;font:600 16px {FONT_STACK};color:{NAVY};">{escape(email_content.greeting)}</p>
              <h1 class="light-heading" style="margin:0 0 14px;font:700 26px/1.25 {FONT_STACK};color:{FOREST_GREEN};">
                {escape(email_content.heading)}
              </h1>
              {paragraphs}
            </td></tr>
            {render_amount(email_content)}
            {render_lines(email_content)}
            <tr><td align="center" style="padding:24px 32px 30px;">
              <a href="{escape(email_content.button_url)}"
                class="light-dark light-white"
                style="display:inline-block;{solid_background(FOREST_GREEN)}color:#ffffff;text-decoration:none;
                font:700 17px {FONT_STACK};padding:14px 30px;border-radius:10px;border:3px solid {NAVY};">
                {escape(email_content.button_label)}
              </a>
              {footnote}
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:18px 12px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" bgcolor="{FOREST_GREEN}"
            class="light-dark" style="{solid_background(FOREST_GREEN)}border-radius:10px;">
            <tr><td align="center" style="padding:8px 16px;font:400 13px/1.5 {FONT_STACK};color:#ffffff;" class="light-white">
              Split groceries, not friendships.<br />
              <a href="{escape(app_url)}" class="light-white" style="color:#ffffff;">Open groSharey</a>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def render_text(email_content: EmailContent) -> str:
    lines = [email_content.greeting, "", email_content.heading, "", *email_content.paragraphs]
    if email_content.amount:
        lines += ["", f"{email_content.amount_label}: {email_content.amount}"]
    if email_content.lines:
        lines += ["", *(f"{line.label}: {line.amount}" for line in email_content.lines)]
    lines += ["", f"{email_content.button_label}: {email_content.button_url}"]
    if email_content.footnote:
        lines += ["", email_content.footnote]
    return "\n".join(lines)
