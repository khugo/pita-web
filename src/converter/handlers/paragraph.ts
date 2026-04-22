/**
 * Paragraph Handler
 *
 * Slack has no special paragraph format — paragraphs are text terminated by
 * a plain newline. Paragraphs nested inside list items are processed by the
 * list-item handler's getFormattedOps.
 */

import type { BlockHandler, HandlerContext } from "../converter-types";
import type { SlackTextOp } from "../types";

export const paragraphHandler: BlockHandler = {
  name: "paragraph",

  canHandle(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    return tagName === "p" && !element.closest("li");
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
