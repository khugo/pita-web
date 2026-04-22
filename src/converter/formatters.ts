/**
 * Text Formatters
 *
 * Functions for extracting and processing inline text formatting for the
 * Slack texty converter (bold, italic, underline, strikethrough, code, links).
 */

import { STYLE_PATTERNS } from "./constants";
import type { ServiceAdapter, SlackTextAttributes, SlackTextOp } from "./types";
import { createTextOp } from "./utils";

/**
 * Extract style-attribute formatting from a CSS style string.
 *
 * @example
 * extractStyleAttributes('font-weight: bold; font-style: italic;')
 * // { bold: true, italic: true }
 */
export function extractStyleAttributes(style: string): SlackTextAttributes {
  const attrs: SlackTextAttributes = {};
  if (STYLE_PATTERNS.bold.test(style)) attrs.bold = true;
  if (STYLE_PATTERNS.italic.test(style)) attrs.italic = true;
  if (STYLE_PATTERNS.underline.test(style)) attrs.underline = true;
  if (STYLE_PATTERNS.strikethrough.test(style)) attrs.strike = true;
  return attrs;
}

/**
 * Map an HTML tag to Slack text attributes.
 *
 * Special handling:
 * - <b>/<strong>: skip if it's a wrapper element (e.g. Google Docs wrapper)
 *   or has explicit `font-weight: normal`.
 * - <a>: extract the actual URL via `adapter.extractUrl` to handle redirects.
 */
export function getTagAttributes(
  tagName: string,
  element: Element,
  style: string,
  adapter: ServiceAdapter,
): SlackTextAttributes {
  const attrs: SlackTextAttributes = {};

  if (
    (tagName === "b" || tagName === "strong") &&
    !adapter.isWrapperElement(element, style) &&
    !STYLE_PATTERNS.boldNormal.test(style)
  ) {
    attrs.bold = true;
  }

  if (tagName === "i" || tagName === "em") attrs.italic = true;
  if (tagName === "u") attrs.underline = true;
  if (tagName === "s" || tagName === "strike" || tagName === "del") {
    attrs.strike = true;
  }
  if (tagName === "code") attrs.code = true;

  if (tagName === "a") {
    const href = element.getAttribute("href");
    if (href) attrs.link = adapter.extractUrl(href);
  }

  return attrs;
}

/**
 * Options for {@link getFormattedOps}.
 */
export interface FormattedOpsOptions {
  /**
   * If true, preserve newlines in text content (used by blockquote handler
   * to split content into lines). Default: false (whitespace-only nodes are
   * skipped and surrounding text is trimmed).
   */
  preserveNewlines?: boolean;
}

/**
 * Recursively extract formatted ops from an element's children.
 *
 * Attributes are merged in order: inherited → tag-based → style-based;
 * later values override earlier ones for the same property.
 */
export function getFormattedOps(
  element: Element,
  adapter: ServiceAdapter,
  inheritedAttrs: SlackTextAttributes = {},
  options: FormattedOpsOptions = {},
): SlackTextOp[] {
  const ops: SlackTextOp[] = [];
  const { preserveNewlines = false } = options;

  for (const child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent;

      if (preserveNewlines && text) {
        ops.push(createTextOp(text, inheritedAttrs));
      } else if (text && text.trim()) {
        ops.push(createTextOp(text.trim(), inheritedAttrs));
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childElement = child as Element;
      const tagName = childElement.tagName.toLowerCase();

      // Nested lists are processed separately by the list-item handler.
      if (tagName === "ul" || tagName === "ol") continue;

      const style = childElement.getAttribute("style") ?? "";

      const attrs: SlackTextAttributes = {
        ...inheritedAttrs,
        ...getTagAttributes(tagName, childElement, style, adapter),
        ...extractStyleAttributes(style),
      };

      ops.push(...getFormattedOps(childElement, adapter, attrs, options));
    }
  }

  return ops;
}
