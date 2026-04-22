/**
 * Notion adapter.
 *
 * Notion encodes list nesting via nested <ul>/<ol> elements:
 *
 * ```html
 * <ul>
 *   <li>Level 1
 *     <ul>
 *       <li>Level 2</li>
 *     </ul>
 *   </li>
 * </ul>
 * ```
 *
 * Notion does not wrap URLs and does not use wrapper-bold elements, so the
 * BaseAdapter defaults for `extractUrl` and `isWrapperElement` are fine.
 */
import { BaseAdapter } from "./base-adapter";

export class NotionAdapter extends BaseAdapter {
  /**
   * Get list nesting level by counting parent ul/ol elements.
   * Always returns at least 1 even if no list parents are found.
   */
  getListLevel(node: Element): number {
    let level = 0;
    let parent = node.parentElement;
    while (parent) {
      const tag = parent.tagName.toLowerCase();
      if (tag === "ul" || tag === "ol") {
        level++;
      }
      parent = parent.parentElement;
    }
    return level || 1;
  }
}

export const notionAdapter = new NotionAdapter();
