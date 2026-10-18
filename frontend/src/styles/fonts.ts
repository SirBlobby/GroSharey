const FONT_STYLESHEET_URL =
  "https://fonts.googleapis.com/css2?family=Itim&family=Josefin+Sans:wght@400;600&family=Outfit:wght@400&display=swap";

export function loadFonts(): void {
  if (document.querySelector(`link[href="${FONT_STYLESHEET_URL}"]`)) {
    return;
  }
  const fontStylesheet = document.createElement("link");
  fontStylesheet.rel = "stylesheet";
  fontStylesheet.href = FONT_STYLESHEET_URL;
  document.head.appendChild(fontStylesheet);
}
