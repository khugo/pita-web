/**
 * HTML to Slack Texty Converter
 *
 * Converts HTML copied from Notion/Google Docs to Slack's `slack/texty`
 * format — a Quill-Delta-like array of ops that Slack's rich-text editor
 * paste handler reads natively. This is what makes nested bullets, ordered
 * lists, blockquotes, and code blocks render as actual rich elements in
 * Slack instead of plain text.
 *
 * Architecture:
 * - Uses TreeWalker for efficient DOM traversal
 * - Delegates element processing to specialised handlers (Handler pattern)
 * - Handlers are tried in order; the first matching handler wins
 *
 * Slack texty conventions:
 * - Block-level formatting (list, blockquote, code-block) lives on the
 *   newline character that terminates the block.
 * - Inline formatting (bold, italic, etc.) lives on the text characters.
 */

import { getFormattedOps } from "./formatters";
import { BLOCK_HANDLERS } from "./handlers";
import type { HandlerContext } from "./converter-types";
import type { ServiceAdapter, SlackTextOp, SlackTexty } from "./types";
import { skipDescendants } from "./utils";

/**
 * Convert HTML to Slack texty format.
 *
 * Walks the document body in order, dispatching each element to the first
 * handler whose `canHandle` returns true. Inline elements without a handler
 * are picked up by their parent's `getFormattedOps` call.
 */
export function convertToSlackTexty(html: string, adapter: ServiceAdapter): SlackTexty {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const ops: SlackTextOp[] = [];

  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, null);

  const context: HandlerContext = {
    adapter,
    walker,
    getFormattedOps: (element, options) => getFormattedOps(element, adapter, {}, options),
    skipDescendants: (node) => skipDescendants(walker, node),
  };

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const element = node as Element;

    for (const handler of BLOCK_HANDLERS) {
      if (handler.canHandle(element)) {
        ops.push(...handler.handle(element, context));
        break;
      }
    }
  }

  return { ops };
}

/**
 * Convert HTML to plain text with light list formatting.
 *
 * Used as the `text/plain` clipboard payload alongside `slack/texty` so apps
 * that don't understand `slack/texty` (i.e. everything except Slack) still
 * get something readable with indented bullets.
 */
export function convertToPlainText(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  let result = "";

  const processNode = (node: Node, level = 0): void => {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim();
        if (text) result += text;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as Element;
        const tagName = element.tagName.toLowerCase();

        if (tagName === "li") {
          const indent = "    ".repeat(level);
          result += `${indent}• ${element.textContent?.trim() ?? ""}\n`;
        } else if (tagName === "ul" || tagName === "ol") {
          processNode(child, level + 1);
        } else if (tagName === "p") {
          result += `${element.textContent?.trim() ?? ""}\n`;
        } else if (tagName === "br") {
          result += "\n";
        } else {
          processNode(child, level);
        }
      }
    }
  };

  processNode(doc.body);
  return result;
}

/**
 * Quick check for whether HTML contains any list elements.
 * Cheap regex test — faster than parsing the DOM.
 */
export function containsLists(html: string): boolean {
  return /<li[\s>]/i.test(html);
}
