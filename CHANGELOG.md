# Changelog

## v0.1.4

### Bug Fixes

- Fix "Copy path" in context menu not working in release mode
  - `navigator.clipboard.writeText()` is blocked in Logseq's sandboxed iframe
  - Add `document.execCommand('copy')` fallback for restricted environments

## v0.1.3

### Bug Fixes

- Fix panel layout not working in release mode (non-developer mode)
  - Use `logseq.provideStyle()` API instead of direct DOM access for main content margin adjustment (cross-origin iframe restriction)
  - Add fallback toolbar height (48px) when parent DOM detection fails in sandboxed iframe

## v0.1.2

### Bug Fixes

- Add empty block after createPage to trigger disk write for git diff

### Docs

- Add screenshots to README (main view, sort menu, context menu, drag & drop)

## v0.1.1

### Improvements

- Remove redundant "Virtual Directory" title from panel header
- Split CI into separate lint, format, test, and build jobs

## v0.1.0 — Initial Release

### Features

- Virtual directory tree view from namespace-separated page names
- Expand/collapse folders with persistent state
- Click to navigate to pages
- Drag & drop to move pages between folders (single and multi-select)
- Multi-select with Ctrl/Cmd+Click and Shift+Click
- Right-click context menu (rename, delete, copy path, create page)
- Inline rename with validation
- Create new pages from the tree header or context menu
- Sort by name (A-Z / Z-A) or last-updated date (Newest / Oldest)
- Folders-first toggle
- Collapse All / Expand All buttons
- Reveal currently opened page in the tree
- Independent panel mode (non-overlapping with Logseq sidebar)
- Smart reload with cache consistency
- Light and dark theme support
- Confirmation dialogs for destructive operations
- Hidden pages setting to filter default Logseq pages
