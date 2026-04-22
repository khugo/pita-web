/**
 * Code Block Handler
 *
 * Converts <pre> code blocks to Slack's code-block format. The
 * `code-block: true` attribute goes on the newline character that terminates
 * each line; line content itself has no inline formatting.
 */

import type { BlockHandler, HandlerContext } from "../converter-types";
import type { SlackTextOp } from "../types";

export const codeBlockHandler: BlockHandler = {
  name: "code-block",

  canHandle(element: Element): boolean {
    return element.tagName.toLowerCase() === "pre";
  },

  handle(element: Element, context: HandlerContext): SlackTextOp[] {
    const ops: SlackTextOp[] = [];

    const codeElement = element.querySelector("code");
    const rawText = codeElement?.textContent ?? element.textContent ?? "";

    // Trim trailing whitespace/newlines but preserve internal structure.
    const text = rawText.replace(/\s+$/, "");

    if (text) {
      const lines = text.split("\n");
      for (const line of lines) {
        if (line) {
          ops.push({ insert: line });
        }
        ops.push({ attributes: { "code-block": true }, insert: "\n" });
      }
    }

    context.skipDescendants(element);
    return ops;
  },
};
