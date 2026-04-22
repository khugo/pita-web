# Pita Web

A tiny static webpage that converts content pasted from **Notion** or **Google Docs** into **Slack-compatible markdown** — no Chrome extension required. Everything runs in the browser.

The conversion logic is vendored from [`ktym4a/pita`](https://github.com/ktym4a/pita) and lives self-contained in [`src/converter/`](src/converter/). The `pita/` folder at the repo root is kept around purely for reference and can be deleted at any time without affecting this app.

## Run locally

```bash
pnpm install
pnpm dev         # vite dev server
pnpm build       # produces a single self-contained dist/index.html
pnpm preview     # serve the built file
pnpm test        # vitest (jsdom) — detect + smoke conversion tests
```

`pnpm build` produces a single `dist/index.html` with all JS and CSS inlined (via [`vite-plugin-singlefile`](https://github.com/richardtallent/vite-plugin-singlefile)). Drop it on any static host or open it with `file://` and it just works.

## How it works

1. The input pane is a `contenteditable` div. On paste, we read the `text/html` clipboard payload directly so the original formatting is preserved.
2. The provider adapter is chosen automatically (Notion vs Google Docs) by sniffing for tell-tale markers (`docs-internal-guid`, `google.com/url?q=`). You can also pick one manually via the segmented control.
3. The pasted HTML is fed to one of the converters in `src/converter/` based on the selected **Format**.
4. The output pane shows a preview; the **Copy** button writes the appropriate payload to the system clipboard.

## Formats

- **Slack rich text** (default) — writes a custom `slack/texty` MIME type plus a plain-text fallback. Slack's rich-text editor reads `slack/texty` natively, so nested bullets, ordered lists, blockquotes, and code blocks paste as actual rich elements (not as `-` characters). Other apps fall back to the plain-text payload (with `•` bullets and indentation).
  - Uses `document.execCommand("copy")` because the modern Clipboard API does not allow writing arbitrary MIME types — this matches what the pita extension does.
- **Markdown** — writes Slack-flavoured markdown as plain text. Useful when Slack's rich-text editor is disabled and you type in raw markdown mode.

## Layout

```
src/
├─ main.ts                  UI wiring (paste / format / copy)
├─ detect.ts                provider auto-detection + adapter selection
├─ clipboard.ts             writeSlackTexty (execCommand) + writeMarkdown
├─ styles.css               minimal modern UI, dark-mode aware
└─ converter/               vendored from pita
   ├─ index.ts
   ├─ types.ts              ServiceAdapter + SlackTexty types
   ├─ constants.ts
   ├─ utils.ts
   ├─ formatters.ts
   ├─ converter-types.ts    HandlerContext / BlockHandler / CharInfo
   ├─ markdown-converter.ts
   ├─ markdown-inline.ts
   ├─ texty-converter.ts    convertToSlackTexty + convertToPlainText
   ├─ handlers/             block handlers (blockquote, code, list-item, …)
   └─ adapters/
      ├─ base-adapter.ts
      ├─ notion.ts
      └─ google-docs.ts

tests/
├─ detect.test.ts           auto-detect heuristic + manual override
├─ convert.smoke.test.ts    markdown end-to-end sanity checks
└─ texty.smoke.test.ts      slack/texty + plain-text fallback checks
```
