# Logseq Virtual Directory Tree

A Logseq plugin that interprets namespace-separated page names (e.g. `dev/react/hooks`) as virtual directories and provides a file-explorer-style tree UI.

## Features

- **Tree View** -- Visualize your namespaced pages as a folder/file tree in a floating side panel
- **Folder Navigation** -- Click folders to expand/collapse, click pages to navigate directly
- **Drag & Drop** -- Reorganize your namespace hierarchy by dragging pages and folders
  - Move pages between folders
  - Move entire folders (bulk rename of all child pages)
  - Drop to root to remove namespace prefix
- **Confirmation Dialogs** -- Review affected pages before any rename operation
- **Theme Support** -- Adapts to Logseq's dark and light themes
- **Persistent State** -- Folder expand/collapse state is saved across plugin reloads

## Installation

1. In Logseq, go to **Settings > Advanced** and enable **Developer mode**
2. Clone or download this repository
3. Run the build:
   ```bash
   npm install
   npm run build
   ```
4. In Logseq, click **Plugins > Load unpacked plugin** and select this project's root directory
5. A folder icon will appear in the toolbar -- click it to toggle the tree panel

## Usage

### Viewing the Tree

Click the folder icon in the Logseq toolbar to open/close the tree panel on the right side. Pages are organized by their namespace hierarchy:

```
cooking/
  grilling
  sous-vide
dev/
  react/
    hooks
    state
  typescript
memo
```

- Folders appear before pages, both sorted alphabetically
- Journal pages are excluded from the tree
- Pages that are both a namespace parent and a page themselves are shown with a dual icon

### Navigating

- **Click a page name** to navigate to that page in Logseq
- **Click a folder icon** to expand or collapse it
- For pages that are also folders, the icon area toggles expand/collapse while the text area navigates

### Drag & Drop

- **Drag a page** onto a folder to move it (renames the page with the new namespace)
- **Drag a folder** onto another folder to move the entire subtree (bulk renames all child pages)
- **Drag to the empty area** below the tree to move to root (removes namespace prefix)
- A confirmation dialog shows all affected pages before any rename is executed
- If some renames fail, a result dialog shows which succeeded and which failed

## Known Limitations

- **File graph only** -- This plugin works with Logseq file-based graphs. DB graphs are not supported.
- **No undo** -- Rename operations cannot be undone through the plugin. Use Logseq's git versioning if you need to revert.
- **API timing** -- A small delay (50ms) is inserted between rename operations to avoid overwhelming Logseq's API.

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
npm install
```

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |

### Tech Stack

- TypeScript, Preact, Vite
- HTML5 Drag and Drop API
- Testing: Vitest, jsdom, @testing-library/preact

### Project Structure

```
src/
  index.tsx            # Plugin entry point
  tree.ts              # Tree data construction logic
  types.ts             # Type definitions
  components/
    App.tsx             # Root component
    TreeView.tsx        # Tree display
    TreeNode.tsx        # Recursive tree node
    ConfirmDialog.tsx   # Confirm/error dialogs
  hooks/
    useTree.ts          # Tree state management
    useDragDrop.ts      # Drag & drop UI state
  utils/
    validation.ts       # Name validation, circular drop detection
    rename.ts           # Rename list generation + execution
    debounce.ts         # Custom debounce function
  __tests__/            # Unit and integration tests
```

## License

MIT
