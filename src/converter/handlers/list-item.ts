/**
 * List Item Handler
 *
 * Converts `<li>` to Slack's list ops: a content op followed by a newline op
 * carrying `{ list: "bullet" | "ordered", indent?: number }` attributes.
 *
 * Nesting comes from `adapter.getListLevel()`:
 * - Notion: counts parent `<ul>`/`<ol>` elements.
 * - Google Docs: reads `aria-level`.
 *
 * This handler intentionally does NOT call `skipDescendants` — Notion's
 * nested `<ul>`/`<ol>` elements need to be processed by subsequent walker
 * iterations to produce their own list-item ops.
 */

import { isOrderedListItem } from "../constants";
import type { BlockHandler, HandlerContext } from "../converter-types";
import type { SlackTextAttributes, SlackTextOp } from "../types";

export const listItemHandler: BlockHandler = {
  name: "list-item",

  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === "li";
  },

  handle(element: Element, context: HandlerContext): SlackTextOp[] {
    const ops: SlackTextOp[] = [];

    const level = context.adapter.getListLevel(element);
    const isOrdered = isOrderedListItem(element);

    const contentOps = context.getFormattedOps(element);
    if (contentOps.length > 0) {
      ops.push(...contentOps);
    }

    const attrs: SlackTextAttributes = {
      list: isOrdered ? "ordered" : "bullet",
    };
    if (level > 1) {
      attrs.indent = level - 1;
    }

    ops.push({ attributes: attrs, insert: "\n" });

    return ops;
  },
};
