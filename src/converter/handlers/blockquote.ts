/**
 * Blockquote Handler
 *
 * Converts <blockquote> elements to Slack's blockquote format.
 *
 * Slack puts the `blockquote: true` attribute on the NEWLINE character that
 * terminates each quoted line, not on the text. This handler does
 * character-level processing so inline formatting (bold, italic, links) is
 * preserved per character while we split on `\n` to add the per-line newline
 * with the blockquote attr.
 */

import type { BlockHandler, CharInfo, HandlerContext } from "../converter-types";
import type { SlackTextOp } from "../types";

/**
 * Build a flat character array from ops, copying each op's attrs onto every
 * character it inserted.
 */
function buildCharInfoArray(contentOps: SlackTextOp[]): CharInfo[] {
  const chars: CharInfo[] = [];
  for (const op of contentOps) {
    for (const char of op.insert) {
      chars.push({ char, attrs: op.attributes });
    }
  }
  return chars;
}

/**
 * Trim leading and trailing whitespace characters from a CharInfo line.
 */
function trimLine(line: CharInfo[]): CharInfo[] {
  const result = [...line];
  while (result.length > 0 && result[0]?.char.trim() === "") {
    result.shift();
  }
  while (result.length > 0 && result[result.length - 1]?.char.trim() === "") {
    result.pop();
  }
  return result;
}

/**
 * Convert a CharInfo line into ops, grouping consecutive characters that
 * share the same attribute set.
 */
function convertLineToOps(line: CharInfo[]): SlackTextOp[] {
  const ops: SlackTextOp[] = [];
  let i = 0;

  while (i < line.length) {
    const startAttrs = line[i]?.attrs;
    const attrsKey = JSON.stringify(startAttrs ?? {});
    let text = "";

    while (i < line.length && JSON.stringify(line[i]?.attrs ?? {}) === attrsKey) {
      text += line[i]?.char ?? "";
      i++;
    }

    if (text) {
      if (startAttrs && Object.keys(startAttrs).length > 0) {
        ops.push({ insert: text, attributes: startAttrs });
      } else {
        ops.push({ insert: text });
      }
    }
  }

  return ops;
}

export const blockquoteHandler: BlockHandler = {
  name: "blockquote",

  /**
   * Standalone blockquotes only — blockquotes inside list items are processed
   * as part of the list item content.
   */
  canHandle(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    return tagName === "blockquote" && !element.closest("li");
  },

  handle(element: Element, context: HandlerContext): SlackTextOp[] {
    const ops: SlackTextOp[] = [];
    const contentOps = context.getFormattedOps(element, { preserveNewlines: true });
    const chars = buildCharInfoArray(contentOps);

    let currentLine: CharInfo[] = [];

    const flushLine = (): void => {
      const trimmed = trimLine(currentLine);
      if (trimmed.length === 0) {
        currentLine = [];
        return;
      }

      ops.push(...convertLineToOps(trimmed));
      ops.push({ attributes: { blockquote: true }, insert: "\n" });
      currentLine = [];
    };

    for (const charInfo of chars) {
      if (charInfo.char === "\n") {
        flushLine();
      } else {
        currentLine.push(charInfo);
      }
    }
    flushLine();

    context.skipDescendants(element);
    return ops;
  },
};
