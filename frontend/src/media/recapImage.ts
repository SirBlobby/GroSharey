import { YearlyRecap } from "../types/insights";
import { money } from "../utils";

const IMAGE_WIDTH = 1080;
const IMAGE_HEIGHT = 1350;
const PAGE_GREEN = "#47a152";
const FOREST_GREEN = "#2a6100";
const MINT = "#dbfacf";
const NAVY = "#1a1856";
const DISPLAY_FONT = "'Itim', 'Chewy', cursive";
const BODY_FONT = "'Josefin Sans', system-ui, sans-serif";

function loadImage(source: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
}

function drawRoundedBox(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  context.beginPath();
  context.roundRect(x, y, width, height, 36);
  context.fill();
  context.stroke();
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let currentLine = "";
  for (const word of text.split(" ")) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(nextLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function drawStat(context: CanvasRenderingContext2D, label: string, value: string, x: number, y: number) {
  context.fillStyle = FOREST_GREEN;
  context.font = `700 76px ${DISPLAY_FONT}`;
  context.fillText(value, x, y);
  context.fillStyle = NAVY;
  context.font = `600 32px ${BODY_FONT}`;
  context.fillText(label, x, y + 48);
}

const LIST_COLUMN_WIDTH = 440;

function fitText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (context.measureText(text).width <= maxWidth) {
    return text;
  }
  let shortenedText = text;
  while (shortenedText.length > 1 && context.measureText(`${shortenedText}…`).width > maxWidth) {
    shortenedText = shortenedText.slice(0, -1);
  }
  return `${shortenedText.trimEnd()}…`;
}

function drawList(context: CanvasRenderingContext2D, title: string, rows: string[], x: number, y: number) {
  context.fillStyle = FOREST_GREEN;
  context.font = `700 40px ${DISPLAY_FONT}`;
  context.fillText(title, x, y);
  context.fillStyle = NAVY;
  context.font = `600 32px ${BODY_FONT}`;
  rows.forEach((row, rowIndex) => {
    context.fillText(fitText(context, row, LIST_COLUMN_WIDTH), x, y + 52 + rowIndex * 46);
  });
}

export async function drawRecapImage(recap: YearlyRecap): Promise<string> {
  await document.fonts?.ready;
  const canvas = document.createElement("canvas");
  canvas.width = IMAGE_WIDTH;
  canvas.height = IMAGE_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("This device can't draw the recap card");
  }
  const [doodles, logo] = await Promise.all([loadImage("/background-doodles.png"), loadImage("/fihh_logo.png")]);

  context.fillStyle = PAGE_GREEN;
  context.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);
  if (doodles) {
    const scale = Math.max(IMAGE_WIDTH / doodles.width, IMAGE_HEIGHT / doodles.height);
    const drawWidth = doodles.width * scale;
    const drawHeight = doodles.height * scale;
    context.drawImage(doodles, (IMAGE_WIDTH - drawWidth) / 2, (IMAGE_HEIGHT - drawHeight) / 2, drawWidth, drawHeight);
  }
  if (logo) {
    context.drawImage(logo, 70, 60, 120, 117);
  }
  context.fillStyle = "#ffffff";
  context.font = `700 72px ${DISPLAY_FONT}`;
  context.fillText("groSharey", 210, 140);
  context.font = `600 40px ${BODY_FONT}`;
  context.fillText(`${recap.scope_name === "You" ? "Your" : `${recap.scope_name}'s`} ${recap.year} recap`, 72, 240);

  context.fillStyle = MINT;
  context.strokeStyle = FOREST_GREEN;
  context.lineWidth = 12;
  drawRoundedBox(context, 60, 290, IMAGE_WIDTH - 120, IMAGE_HEIGHT - 380);

  context.fillStyle = NAVY;
  context.font = `700 50px ${DISPLAY_FONT}`;
  wrapText(context, recap.headline, IMAGE_WIDTH - 240).forEach((line, lineIndex) => {
    context.fillText(line, 120, 390 + lineIndex * 62);
  });

  drawStat(context, "grocery runs", String(recap.grocery_runs), 120, 640);
  drawStat(context, "items bought", String(recap.items_bought), 560, 640);
  drawStat(context, "spent together", money(recap.total_spent), 120, 820);
  drawStat(context, "your share", money(recap.your_share), 560, 820);

  const topProducts = recap.top_products
    .slice(0, 3)
    .map((item, itemIndex) => `${itemIndex + 1}. ${item.product} (${item.count}x)`);
  drawList(context, "Top buys", topProducts, 120, 970);
  const favorites = [
    recap.top_stores[0] ? `Store: ${recap.top_stores[0].store}` : "Store: none yet",
    recap.shopping_buddy ? `Buddy: ${recap.shopping_buddy.name}` : "Buddy: none yet",
  ];
  if (recap.members[0]) {
    favorites.push(`Top spender: ${recap.members[0].name}`);
  }
  drawList(context, "Favorites", favorites, 600, 970);

  context.fillStyle = "#ffffff";
  context.font = `600 30px ${BODY_FONT}`;
  context.fillText("Split groceries, not friendships.", 72, IMAGE_HEIGHT - 40);
  return canvas.toDataURL("image/png");
}
