/**
 * Google Docs adapter.
 *
 * Google Docs specifics handled here:
 * - List nesting is encoded via the `aria-level` attribute (accessibility),
 *   not nested <ul>/<ol>.
 * - External links are wrapped through `https://www.google.com/url?q=…`
 *   for tracking; we extract the real destination from the `q` param.
 * - Top-level content is wrapped in `<b id="docs-internal-guid-…">` tags
 *   that aren't actually bold — we treat them as transparent containers.
 */
import { STYLE_PATTERNS } from "../constants";
import { BaseAdapter } from "./base-adapter";

export class GoogleDocsAdapter extends BaseAdapter {
  /**
   * Get list nesting level from the aria-level attribute, defaulting to 1.
   */
  getListLevel(node: Element): number {
    const ariaLevel = node.getAttribute("aria-level");
    if (ariaLevel) {
      return parseInt(ariaLevel, 10);
    }
    return 1;
  }

  /**
   * Extract the destination URL from a Google redirect link.
   * Returns the original href unchanged for non-redirect URLs or on parse error.
   */
  extractUrl(href: string): string {
    if (!href.includes("google.com/url")) {
      return href;
    }
    try {
      const url = new URL(href);
      return url.searchParams.get("q") ?? href;
    } catch {
      return href;
    }
  }

  /**
   * Detect Google Docs wrapper elements that should not be treated as bold.
   * These are `<b id="docs-internal-guid-…">` containers and elements with
   * an explicit `font-weight: normal` style overriding their tag.
   */
  isWrapperElement(element: Element, style: string): boolean {
    return element.id?.startsWith("docs-internal-guid") || STYLE_PATTERNS.boldNormal.test(style);
  }
}

export const googleDocsAdapter = new GoogleDocsAdapter();
