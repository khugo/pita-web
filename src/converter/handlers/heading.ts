/**
 * Heading Handler
 *
 * Slack texty has no heading attribute, so `<h1>`-`<h6>` are emitted as plain
 * text with a terminating newline. Inline formatting is preserved; the
 * heading level is dropped.
 */

import type { BlockHandler, HandlerContext } from "../converter-types";
import type { SlackTextOp } from "../types";

export const headingHandler: BlockHandler = {
  name: "heading",

  /** Match `<h1>`-`<h6>` outside list items. */
  canHandle(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    return /^h[1-6]$/.test(tagName) && !element.closest("li");
  },

  handle(element: Element, context: HandlerContext): SlackTextOp[] {
    const ops: SlackTextOp[] = [];

    const contentOps = context.getFormattedOps(element);
    if (contentOps.length > 0) {
      ops.push(...contentOps);
      ops.push({ insert: "\n" });
    }

    context.skipDescendants(element);
    return ops;
  },
};
