import { describe, expect, it } from "vitest";

import {
  convertToPlainText,
  convertToSlackTexty,
  googleDocsAdapter,
  notionAdapter,
} from "../src/converter";

describe("convertToSlackTexty — Notion smoke", () => {
  it("emits a bullet newline for each list item", () => {
    const html = "<ul><li>a</li><li>b</li></ul>";
    const { ops } = convertToSlackTexty(html, notionAdapter);

    const bulletNewlines = ops.filter(
      (op) => op.insert === "\n" && op.attributes?.list === "bullet",
    );
    expect(bulletNewlines).toHaveLength(2);
    expect(bulletNewlines[0].attributes?.indent).toBeUndefined();
  });

  it("adds indent on nested list items based on parent depth", () => {
    const html =
      "<ul><li>top<ul><li>nested</li></ul></li></ul>";
    const { ops } = convertToSlackTexty(html, notionAdapter);

    const bulletNewlines = ops.filter(
      (op) => op.insert === "\n" && op.attributes?.list === "bullet",
    );
    expect(bulletNewlines).toHaveLength(2);
    expect(bulletNewlines[0].attributes?.indent).toBeUndefined();
    expect(bulletNewlines[1].attributes?.indent).toBe(1);
  });

  it("marks ordered list items with list: 'ordered'", () => {
    const html = "<ol><li>first</li><li>second</li></ol>";
    const { ops } = convertToSlackTexty(html, notionAdapter);

    const orderedNewlines = ops.filter(
      (op) => op.insert === "\n" && op.attributes?.list === "ordered",
    );
    expect(orderedNewlines).toHaveLength(2);
  });

  it("preserves inline bold formatting on list item text", () => {
    const html = "<ul><li><strong>bold</strong> text</li></ul>";
    const { ops } = convertToSlackTexty(html, notionAdapter);

    const boldOp = ops.find((op) => op.attributes?.bold);
    expect(boldOp?.insert).toBe("bold");
  });
});

describe("convertToSlackTexty — Google Docs smoke", () => {
  it("uses aria-level for indent", () => {
    const html =
      '<ul>' +
      '<li aria-level="1">one</li>' +
      '<li aria-level="2">two</li>' +
      '<li aria-level="3">three</li>' +
      '</ul>';
    const { ops } = convertToSlackTexty(html, googleDocsAdapter);

    const bulletNewlines = ops.filter(
      (op) => op.insert === "\n" && op.attributes?.list === "bullet",
    );
    expect(bulletNewlines).toHaveLength(3);
    expect(bulletNewlines[0].attributes?.indent).toBeUndefined();
    expect(bulletNewlines[1].attributes?.indent).toBe(1);
    expect(bulletNewlines[2].attributes?.indent).toBe(2);
  });
});

describe("convertToPlainText — fallback used alongside slack/texty", () => {
  it("renders a flat bullet list with one indent level", () => {
    const html = "<ul><li>one</li><li>two</li></ul>";
    const out = convertToPlainText(html);
    expect(out).toBe("    • one\n    • two\n");
  });

  it("renders paragraphs as separate lines", () => {
    const html = "<p>first</p><p>second</p>";
    expect(convertToPlainText(html)).toBe("first\nsecond\n");
  });
});
