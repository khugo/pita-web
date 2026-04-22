/**
 * Base adapter providing default `ServiceAdapter` implementations.
 *
 * Subclasses must implement `getListLevel`. `extractUrl` and
 * `isWrapperElement` have safe defaults that subclasses can override.
 */
import type { ServiceAdapter } from "../types";

export abstract class BaseAdapter implements ServiceAdapter {
  abstract getListLevel(node: Element): number;

  extractUrl(href: string): string {
    return href;
  }

  isWrapperElement(_element: Element, _style: string): boolean {
    return false;
  }
}
