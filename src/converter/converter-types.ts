/**
 * Internal types for the Handler-pattern texty converter.
 * Kept separate from the public `types.ts` (which exposes the adapter +
 * Slack texty document types) because these are only meaningful to the
 * handlers themselves.
 */
import type { ServiceAdapter, SlackTextAttributes, SlackTextOp } from "./types";

/**
 * Context passed to every block handler.
 *
 * Provides:
 * - `adapter`: provider-specific behaviour (list level, URL extraction)
 * - `walker`: the shared TreeWalker traversing the document
 * - `getFormattedOps`: extract formatted text with inline styles preserved
 * - `skipDescendants`: skip child nodes when a handler processes the subtree
 */
export interface HandlerContext {
  readonly adapter: ServiceAdapter;
  readonly walker: TreeWalker;
  /**
   * Extract formatted ops from an element.
   * @param options.preserveNewlines - if true, preserve literal newlines (used by blockquote)
   */
  getFormattedOps(element: Element, options?: { preserveNewlines?: boolean }): SlackTextOp[];
  /** Skip all descendants of a node in the walker. */
  skipDescendants(node: Node): void;
}

/**
 * Block handler interface.
 *
 * Each handler is responsible for one type of block element. Handlers are
 * tried in order; the first whose `canHandle` returns `true` processes
 * the element.
 */
export interface BlockHandler {
  readonly name: string;
  /** Fast check (no DOM traversal) for whether this handler applies. */
  canHandle(element: Element): boolean;
  /** Process the element and return SlackTextOps. */
  handle(element: Element, context: HandlerContext): SlackTextOp[];
}

/**
 * Per-character info used by the blockquote handler to split content into
 * lines while preserving inline formatting attributes.
 */
export interface CharInfo {
  char: string;
  attrs?: SlackTextAttributes;
}
