/**
 * Service adapter interface used by both converters.
 *
 * Provider-specific adapters (Notion, Google Docs) implement this to handle
 * differences in HTML structure: list nesting detection, URL unwrapping, and
 * non-formatting wrapper-element detection.
 *
 * Trimmed from pita's full ServiceAdapter — extension-only event/cleanup
 * methods and identifier metadata were removed since neither converter uses them.
 */
export interface ServiceAdapter {
  /**
   * Get list nesting level from a list-item element.
   * 1-based: top level is 1.
   */
  getListLevel(node: Element): number;

  /**
   * Extract the actual destination URL from a (possibly redirect-wrapped) href.
   * Default implementations return the href unchanged.
   */
  extractUrl(href: string): string;

  /**
   * Check whether an element is a structural wrapper rather than real
   * formatting (e.g. Google Docs `<b id="docs-internal-guid-…">`).
   */
  isWrapperElement(element: Element, style: string): boolean;
}

/**
 * Slack texty operation attributes.
 *
 * Maps to Slack's internal rich text format (Quill-Delta-like).
 * Block-level attributes (list, blockquote, code-block) go on newline characters.
 * Inline attributes (bold, italic, etc.) go on text characters.
 */
export interface SlackTextAttributes {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  link?: string;
  list?: "bullet" | "ordered";
  /** 0-based indentation level for nested lists. */
  indent?: number;
  blockquote?: boolean;
  "code-block"?: boolean;
}

/**
 * Single operation in Slack texty format (Delta-like).
 * Each op represents a piece of text with optional formatting.
 */
export interface SlackTextOp {
  insert: string;
  attributes?: SlackTextAttributes;
}

/**
 * Slack texty document format.
 *
 * This is the JSON structure that gets written to the clipboard with MIME
 * type `slack/texty` so Slack's rich-text editor can paste it natively.
 */
export interface SlackTexty {
  ops: SlackTextOp[];
}
