# Logseq Virtual Directory Tree

A Logseq plugin that interprets namespace-separated page names (e.g. `dev/react/hooks`) as virtual directories and provides a file-explorer-style tree UI in the sidebar.

## Features

- **Tree View** -- Visualize your namespaced pages as a folder/file tree in a side panel
- **Folder Navigation** -- Click folders to expand/collapse, click pages to navigate directly
- **Drag & Drop** -- Reorganize your namespace hierarchy by dragging pages and folders
  - Move pages between folders
  - Move entire folders (bulk rename of all child pages)
  - Drop to root to remove namespace prefix
  - Multi-select drag & drop (move multiple items at once)
- **Multi-Select** -- Select multiple pages/folders with Ctrl+Click and Shift+Click
- **Right-Click Context Menu** -- Rename, delete, copy path, or create a page in a folder
- **Inline Rename** -- Rename pages and folders directly in the tree
- **Create Page** -- Create new pages, optionally under a selected folder
- **Sorting** -- Sort the tree by name or last-updated date, ascending or descending, with an optional folders-first toggle
- **Reveal Current Page** -- Highlight and scroll to the currently opened page in the tree
- **Expand/Collapse All** -- Quickly expand or collapse the entire tree
- **Independent Panel** -- Side panel does not overlap Logseq's main content area
- **Smart Reload** -- Efficiently refreshes the tree using diff-based updates to preserve expand/collapse state
- **Confirmation Dialogs** -- Review affected pages before any rename or move operation
- **Theme Support** -- Adapts to Logseq's dark and light themes
- **Persistent State** -- Folder expand/collapse state and sort preferences are saved across reloads
- **Keyboard Support** -- Press Escape to close any open dialog or menu

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

- Folders appear before pages by default (configurable)
- Journal pages are excluded from the tree
- Pages that are both a namespace parent and a page themselves are shown with a dual icon

### Navigating

- **Click a page name** to navigate to that page in Logseq
- **Click a folder icon** to expand or collapse it
- For pages that are also folders, the icon area toggles expand/collapse while the text area navigates

### Multi-Select

- **Ctrl+Click** (Cmd+Click on macOS) to toggle individual items
- **Shift+Click** to select a range of items
- Selected items are highlighted and can be dragged together

### Drag & Drop

- **Drag a page** onto a folder to move it (renames the page with the new namespace)
- **Drag a folder** onto another folder to move the entire subtree (bulk renames all child pages)
- **Drag multiple selected items** to move them all at once
- **Drag to the empty area** below the tree to move to root (removes namespace prefix)
- A confirmation dialog shows all affected pages before any rename is executed
- If some renames fail, a result dialog shows which succeeded and which failed

### Context Menu

Right-click any node to access:

- **Rename** -- Inline rename of the page or folder
- **Delete** -- Delete the page (with confirmation)
- **Copy path** -- Copy the full namespace path to clipboard
- **Create page here** -- Create a new page under this folder

### Sorting

Click the sort icon in the header toolbar to choose a sort order:

- **Name (A-Z / Z-A)** -- Alphabetical sorting
- **Updated (Newest / Oldest)** -- Sort by last-modified date (folder dates are derived from their most recently updated descendant)
- **Folders first** -- Toggle whether folders appear before pages

### Toolbar Actions

The header toolbar provides quick access to:

- **Sort** -- Open the sort menu
- **Reveal** -- Scroll to and highlight the currently opened page
- **Create** -- Create a new page (uses selected folder as prefix if one is selected)
- **Expand All / Collapse All** -- Expand or collapse every folder in the tree
- **Close** -- Hide the panel

## Known Limitations

- **File graph only** -- This plugin works with Logseq file-based graphs. DB graphs are not supported.
- **No undo** -- Rename operations cannot be undone through the plugin. Use Logseq's git versioning if you need to revert.
- **API timing** -- A small delay is inserted between rename operations to avoid overwhelming Logseq's API.

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
    TreeView.tsx        # Tree display with sticky header
    TreeNode.tsx        # Recursive tree node
    ConfirmDialog.tsx   # Confirm/loading/result dialogs
    ContextMenu.tsx     # Right-click context menu
    CreatePageDialog.tsx # New page creation dialog
    InlineRenameInput.tsx # Inline rename input
    SortMenu.tsx        # Sort dropdown menu
  hooks/
    useTree.ts          # Tree state management & smart reload
    useDragDrop.ts      # Drag & drop UI state
    useSelection.ts     # Multi-select state
    useContextMenu.ts   # Context menu state
  utils/
    validation.ts       # Name validation, circular drop detection
    rename.ts           # Rename list generation + execution
    panelLayout.ts      # Panel positioning & main content layout
    treeDiff.ts         # Diff-based tree update for smart reload
    debounce.ts         # Custom debounce function
  __tests__/            # Unit and integration tests
```

## License

MIT
