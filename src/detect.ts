/**
 * Provider detection and adapter selection.
 *
 * The auto-detect heuristic mirrors the markers that the adapters themselves
 * key on:
 * - `docs-internal-guid` is what `GoogleDocsAdapter.isWrapperElement` checks for
 * - `google.com/url?q=` is what `GoogleDocsAdapter.extractUrl` unwraps
 *
 * Anything else (including anything Notion-shaped) falls back to Notion.
 */
import {
  type ServiceAdapter,
  googleDocsAdapter,
  notionAdapter,
} from "./converter";

export type ProviderId = "notion" | "google-docs";
export type Mode = "auto" | ProviderId;

const GOOGLE_DOCS_MARKERS = /docs-internal-guid|google\.com\/url\?q=/i;

/**
 * Auto-detect which provider produced a given HTML clipboard payload.
 */
export function detectProvider(html: string): ProviderId {
  return GOOGLE_DOCS_MARKERS.test(html) ? "google-docs" : "notion";
}

/**
 * Pick the adapter for a given mode and HTML payload.
 * In `auto` mode the provider is detected from the HTML; otherwise the mode
 * value is used directly.
 */
export function pickAdapter(mode: Mode, html: string): { id: ProviderId; adapter: ServiceAdapter } {
  const id = mode === "auto" ? detectProvider(html) : mode;
  const adapter = id === "google-docs" ? googleDocsAdapter : notionAdapter;
  return { id, adapter };
}

/**
 * Human-readable label for a provider id.
 */
export function providerLabel(id: ProviderId): string {
  return id === "google-docs" ? "Google Docs" : "Notion";
}
