import { describe, expect, it } from "vitest";

import { googleDocsAdapter, notionAdapter } from "../src/converter";
import { detectProvider, pickAdapter } from "../src/detect";

describe("detectProvider", () => {
  it("detects Google Docs from docs-internal-guid wrapper", () => {
    const html = '<b id="docs-internal-guid-12345"><p>hello</p></b>';
    expect(detectProvider(html)).toBe("google-docs");
  });

  it("detects Google Docs from a google.com/url?q= redirect link", () => {
    const html =
      '<p><a href="https://www.google.com/url?q=https://example.com">link</a></p>';
    expect(detectProvider(html)).toBe("google-docs");
  });

  it("falls back to Notion for everything else", () => {
    expect(detectProvider("<p>just text</p>")).toBe("notion");
    expect(detectProvider("<ul><li>item</li></ul>")).toBe("notion");
    expect(detectProvider("")).toBe("notion");
  });
});

describe("pickAdapter", () => {
  it("uses auto-detection in auto mode", () => {
    const docsHtml = '<b id="docs-internal-guid-x"></b>';
    expect(pickAdapter("auto", docsHtml).adapter).toBe(googleDocsAdapter);
    expect(pickAdapter("auto", "<p>plain</p>").adapter).toBe(notionAdapter);
  });

  it("honours an explicit override regardless of HTML markers", () => {
    const docsHtml = '<b id="docs-internal-guid-x"></b>';
    expect(pickAdapter("notion", docsHtml).adapter).toBe(notionAdapter);
    expect(pickAdapter("google-docs", "<p>plain</p>").adapter).toBe(googleDocsAdapter);
  });

  it("returns the matching id alongside the adapter", () => {
    expect(pickAdapter("notion", "").id).toBe("notion");
    expect(pickAdapter("google-docs", "").id).toBe("google-docs");
    expect(pickAdapter("auto", '<b id="docs-internal-guid-x"></b>').id).toBe("google-docs");
  });
});
