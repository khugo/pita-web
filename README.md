# Pita Web

A thin web wrapper around [`ktym4a/pita`](https://github.com/ktym4a/pita). Paste from **Notion** or **Google Docs**, get Slack-ready rich text (or markdown) in your clipboard — without installing a Chrome extension.

All of the conversion logic — HTML parsing, the `slack/texty` rich-text output, the markdown output, the Notion and Google Docs adapters — is pita. This project is just a small static page that pipes your clipboard through pita's converter and writes the result back out.

The pita code lives self-contained under [`src/converter/`](src/converter/), vendored verbatim (MIT) with imports rewritten to relative paths.

## Run locally

```bash
pnpm install
pnpm dev         # vite dev server
pnpm build       # produces a single self-contained dist/index.html
pnpm preview     # serve the built file
pnpm test        # vitest (jsdom) — detect + smoke conversion tests
```

`pnpm build` produces a single `dist/index.html` with all JS and CSS inlined (via [`vite-plugin-singlefile`](https://github.com/richardtallent/vite-plugin-singlefile)). Drop it on any static host or open it with `file://` and it just works.