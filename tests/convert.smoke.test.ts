import { describe, expect, it } from "vitest";

import {
  convertToSlackMarkdown,
  googleDocsAdapter,
  notionAdapter,
} from "../src/converter";

describe("convertToSlackMarkdown — Notion smoke", () => {
  it("formats a bold list item", () => {
    const html = "<ul><li><strong>Hi</strong> there</li></ul>";
    expect(convertToSlackMarkdown(html, notionAdapter)).toBe("- *Hi* there\n");
  });

  it("indents nested lists by their nesting depth", () => {
    const html = `
      <ul>
        <li>top
          <ul>
            <li>nested</li>
          </ul>
        </li>
      </ul>
    `;
    const out = convertToSlackMarkdown(html, notionAdapter);
    expect(out).toContain("- top\n");
    expect(out).toContain("    - nested\n");
  });

  it("converts headings and paragraphs to plain lines", () => {
    const html = "<h1>Title</h1><p>Body <em>italic</em>.</p>";
    expect(convertToSlackMarkdown(html, notionAdapter)).toBe("Title\nBody _italic_ .\n");
  });
});

describe("convertToSlackMarkdown — Google Docs smoke", () => {
  it("treats docs-internal-guid wrapper as transparent and unwraps redirect links", () => {
    const html =
      '<b id="docs-internal-guid-x"><p>hello ' +
      '<a href="https://www.google.com/url?q=https://example.com">link</a></p></b>';
    expect(convertToSlackMarkdown(html, googleDocsAdapter)).toBe(
      "hello [link](https://example.com)\n",
    );
  });

  it("uses aria-level for list nesting", () => {
    const html =
      '<ul><li aria-level="1">one</li>' +
      '<li aria-level="2">two</li>' +
      '<li aria-level="3">three</li></ul>';
    const out = convertToSlackMarkdown(html, googleDocsAdapter);
    expect(out).toBe("- one\n    - two\n        - three\n");
  });
});
