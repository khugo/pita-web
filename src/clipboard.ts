/**
 * Clipboard helpers.
 *
 * `writeSlackTexty` uses `document.execCommand("copy")` because the modern
 * Clipboard API does not allow writing arbitrary MIME types like
 * `slack/texty` (browsers sanitise / restrict custom types). Pita ships the
 * same technique today.
 */
import type { SlackTexty } from "./converter";

/**
 * Write Slack rich text (slack/texty) and a plain-text fallback to the
 * clipboard in a single copy event.
 *
 * Slack reads the `slack/texty` JSON natively; everything else falls back to
 * the `text/plain` payload. Returns `false` if `execCommand("copy")` is not
 * supported or fails — callers can then fall back to `writeMarkdown`.
 */
export function writeSlackTexty(plainText: string, texty: SlackTexty): boolean {
  const textyJson = JSON.stringify(texty);

  const handler = (e: ClipboardEvent): void => {
    e.preventDefault();
    e.clipboardData?.setData("text/plain", plainText);
    e.clipboardData?.setData("slack/texty", textyJson);
  };

  document.addEventListener("copy", handler, { once: true });
  try {
    return document.execCommand("copy");
  } catch {
    document.removeEventListener("copy", handler);
    return false;
  }
}

/**
 * Write a plain-text payload (markdown or otherwise) via the modern Clipboard
 * API. Used for the markdown format since Slack just reads `text/plain`.
 */
export async function writeMarkdown(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
