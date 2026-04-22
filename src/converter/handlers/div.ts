/**
 * Div Handler
 *
 * Fallback for `<div>` elements that contain text content. Many web apps use
 * divs in place of semantic block elements; we treat them as paragraphs when
 * they have direct text or inline-element content. Layout-only divs are
 * skipped so they don't introduce blank lines.
 */

import { INLINE_TAGS } from "../constants";
import type { BlockHandler, HandlerContext } from "../converter-types";
import type { SlackTextOp } from "../types";

export const divHandler: BlockHandler = {
  name: "div",

  /**
   * Match `<div>` elements that are not inside list items or paragraphs.
   * The content check happens in `handle` since it requires a DOM scan.
   */
  canHandle(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    return tagName === "div" && !element.closest("li") && !element.closest("p");
  },

  handle(element: Element, context: HandlerContext): SlackTextOp[] {
    const ops: SlackTextOp[] = [];

    const hasTextContent = Array.from(element.childNodes).some(
      (child) => child.nodeType === Node.TEXT_NODE && (child.textContent?.trim() ?? ""),
    );

    const inlineSelector = INLINE_TAGS.join(", ");
    const hasInlineElements = element.querySelector(inlineSelector);

    if (hasTextContent || hasInlineElements) {
      const contentOps = context.getFormattedOps(element);
      if (contentOps.length > 0) {
        ops.push(...contentOps);
        ops.push({ insert: "\n" });
      }
    }

    context.skipDescendants(element);
    return ops;
  },
};
