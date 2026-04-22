/**
 * Converter utilities shared by the texty converter and its handlers.
 */
import type { SlackTextAttributes, SlackTextOp } from "./types";

/**
 * Build a text operation, omitting the `attributes` key when there are none.
 * Keeps the resulting JSON clean and matches Slack's expected format.
 */
export function createTextOp(text: string, attrs: SlackTextAttributes): SlackTextOp {
  if (Object.keys(attrs).length > 0) {
    return { insert: text, attributes: { ...attrs } };
  }
  return { insert: text };
}

/**
 * Skip all descendants of a node in a TreeWalker.
 *
 * When a handler processes an entire subtree (e.g. blockquote, code block),
 * it must skip descendant nodes to prevent double-processing. TreeWalker has
 * no `skipChildren`, so we walk forward until we leave the subtree, then
 * step back one so the next `nextNode()` call lands on the right neighbour.
 */
export function skipDescendants(walker: TreeWalker, node: Node): void {
  let next = walker.nextNode();
  while (next && node.contains(next)) {
    next = walker.nextNode();
  }
  if (next && !node.contains(next)) {
    walker.previousNode();
  }
}
