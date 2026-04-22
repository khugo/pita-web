/**
 * Block Handlers Registry
 *
 * Order matters — more specific handlers first; the first whose `canHandle`
 * returns true processes the element.
 *
 * 1. blockquote — must come before paragraph (blockquotes may contain `<p>`)
 * 2. code-block — `<pre>` elements
 * 3. list-item — `<li>` elements (does NOT skip descendants for nested lists)
 * 4. paragraph — `<p>` outside lists
 * 5. heading — `<h1>`-`<h6>`
 * 6. div — fallback for divs with text content
 */
import type { BlockHandler } from "../converter-types";
import { blockquoteHandler } from "./blockquote";
import { codeBlockHandler } from "./code-block";
import { divHandler } from "./div";
import { headingHandler } from "./heading";
import { listItemHandler } from "./list-item";
import { paragraphHandler } from "./paragraph";

export const BLOCK_HANDLERS: readonly BlockHandler[] = [
  blockquoteHandler,
  codeBlockHandler,
  listItemHandler,
  paragraphHandler,
  headingHandler,
  divHandler,
];

export {
  blockquoteHandler,
  codeBlockHandler,
  listItemHandler,
  paragraphHandler,
  headingHandler,
  divHandler,
};
