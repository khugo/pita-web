import { writeMarkdown, writeSlackTexty } from "./clipboard";
import {
  type SlackTexty,
  convertToPlainText,
  convertToSlackMarkdown,
  convertToSlackTexty,
} from "./converter";
import { type Mode, type ProviderId, pickAdapter, providerLabel } from "./detect";
import "./styles.css";

type Format = "rich" | "markdown";

const inputEl = document.getElementById("input") as HTMLDivElement;
const outputEl = document.getElementById("output") as HTMLPreElement;
const panesEl = document.getElementById("panes") as HTMLElement;
const copyBtn = document.getElementById("copy") as HTMLButtonElement;
const clearBtn = document.getElementById("clear") as HTMLButtonElement;
const badgeEl = document.getElementById("detected-badge") as HTMLSpanElement;
const providerInputs = Array.from(
  document.querySelectorAll<HTMLInputElement>('input[name="provider"]'),
);
const formatInputs = Array.from(
  document.querySelectorAll<HTMLInputElement>('input[name="format"]'),
);

/**
 * The most recently captured raw HTML payload from the input area.
 * Stored separately from the contenteditable's innerHTML so we can re-run
 * conversion on provider/format change without re-reading the DOM (which the
 * browser may have normalised).
 */
let currentHtml = "";

/** Latest converted output, kept in module scope for the copy handler. */
let currentMarkdown = "";
let currentTexty: SlackTexty = { ops: [] };
let currentPlain = "";

/**
 * Toggle the single-pane layout (rich text mode has no useful text preview,
 * so we hide the output pane entirely).
 */
function applyLayout(format: Format): void {
  panesEl.classList.toggle("single", format === "rich");
}

/**
 * Wrap a plain-text payload in a minimal HTML document so the converters have
 * something to walk. Newlines become `<br>`, blank lines become paragraph breaks.
 */
function plainTextToHtml(text: string): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const paragraphs = text.split(/\n{2,}/).map((p) => escape(p).replace(/\n/g, "<br>"));
  return paragraphs.map((p) => `<p>${p}</p>`).join("");
}

function currentMode(): Mode {
  const checked = providerInputs.find((i) => i.checked);
  return (checked?.value as Mode) ?? "auto";
}

function currentFormat(): Format {
  const checked = formatInputs.find((i) => i.checked);
  return (checked?.value as Format) ?? "rich";
}

/**
 * Render the auto-detect badge for the active provider. Only shown in `auto`
 * mode and only when there's input to detect from.
 */
function updateBadge(mode: Mode, detectedId: ProviderId): void {
  if (mode !== "auto" || !currentHtml) {
    badgeEl.hidden = true;
    return;
  }
  badgeEl.textContent = `Detected: ${providerLabel(detectedId)}`;
  badgeEl.hidden = false;
}

/**
 * Run the active converter on the stored HTML and refresh the output pane.
 */
function convert(): void {
  const format = currentFormat();
  applyLayout(format);

  if (!currentHtml.trim()) {
    outputEl.textContent = "";
    copyBtn.disabled = true;
    badgeEl.hidden = true;
    currentMarkdown = "";
    currentTexty = { ops: [] };
    currentPlain = "";
    return;
  }

  const mode = currentMode();
  const { id, adapter } = pickAdapter(mode, currentHtml);

  if (format === "rich") {
    currentTexty = convertToSlackTexty(currentHtml, adapter);
    currentPlain = convertToPlainText(currentHtml);
    currentMarkdown = "";
    outputEl.textContent = "";
    copyBtn.disabled = currentTexty.ops.length === 0;
  } else {
    currentMarkdown = convertToSlackMarkdown(currentHtml, adapter);
    currentTexty = { ops: [] };
    currentPlain = "";
    outputEl.textContent = currentMarkdown;
    copyBtn.disabled = !currentMarkdown;
  }

  updateBadge(mode, id);
}

inputEl.addEventListener("paste", (e) => {
  e.preventDefault();
  const dt = e.clipboardData;
  if (!dt) return;

  const html = dt.getData("text/html");
  const text = dt.getData("text/plain");

  currentHtml = html || (text ? plainTextToHtml(text) : "");
  inputEl.innerHTML = currentHtml;
  convert();
});

inputEl.addEventListener("input", () => {
  // User edited the contenteditable directly (not via paste).
  // Treat its innerHTML as the new source so they can tweak the input.
  currentHtml = inputEl.innerHTML;
  convert();
});

providerInputs.forEach((input) => input.addEventListener("change", convert));
formatInputs.forEach((input) => input.addEventListener("change", convert));

clearBtn.addEventListener("click", () => {
  currentHtml = "";
  inputEl.innerHTML = "";
  inputEl.focus();
  convert();
});

let copyResetTimer: number | undefined;

/**
 * Show transient feedback on the copy button, restoring the default label
 * after a short delay.
 */
function flashCopyLabel(label: string, success: boolean, ms = 1400): void {
  copyBtn.textContent = label;
  copyBtn.classList.toggle("copied", success);
  if (copyResetTimer) window.clearTimeout(copyResetTimer);
  copyResetTimer = window.setTimeout(() => {
    copyBtn.textContent = "Convert & copy";
    copyBtn.classList.remove("copied");
  }, ms);
}

copyBtn.addEventListener("click", async () => {
  const format = currentFormat();
  try {
    if (format === "rich") {
      if (currentTexty.ops.length === 0) return;
      const ok = writeSlackTexty(currentPlain, currentTexty);
      if (!ok) {
        // Fallback if execCommand("copy") is blocked or unsupported.
        await writeMarkdown(currentPlain);
      }
    } else {
      if (!currentMarkdown) return;
      await writeMarkdown(currentMarkdown);
    }
    flashCopyLabel("Copied!", true);
  } catch (err) {
    console.error("Clipboard write failed", err);
    flashCopyLabel("Copy failed", false, 1800);
  }
});
