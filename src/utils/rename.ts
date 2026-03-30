import type { TreeNode } from '../types';

export interface RenameEntry {
  oldName: string;
  newName: string;
}

export interface RenameResult {
  succeeded: RenameEntry[];
  failed: Array<RenameEntry & { error: string }>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface PageInfo {
  fullPath: string;
  originalName: string;
}

// Collect all actual pages (type 'page' or 'both') under a node, recursively.
function collectPages(node: TreeNode): PageInfo[] {
  const pages: PageInfo[] = [];
  if (node.type === 'page' || node.type === 'both') {
    pages.push({
      fullPath: node.fullPath,
      originalName: node.originalName ?? node.fullPath,
    });
  }
  for (const child of node.children) {
    pages.push(...collectPages(child));
  }
  return pages;
}

// Build a list of renames needed to move sourceNode into targetFolder.
// If targetFolder is empty string, it means moving to root (namespace removal).
// Uses fullPath (trimmed) for prefix matching, originalName for API calls.
export function buildRenameList(
  sourceNode: TreeNode,
  targetFolder: string
): RenameEntry[] {
  const pages = collectPages(sourceNode);
  const sourcePrefix = sourceNode.fullPath;

  return pages.map(({ fullPath, originalName }) => {
    // Use trimmed fullPath for prefix matching (consistent with tree structure)
    const suffix = fullPath.slice(sourcePrefix.length); // e.g. "" or "/hooks"
    const newBase =
      targetFolder === ''
        ? sourceNode.name
        : targetFolder + '/' + sourceNode.name;
    const newName = newBase + suffix;
    // Use originalName for the API call (preserves spaces around /)
    return { oldName: originalName, newName };
  });
}

// Build rename lists for multiple source nodes, merge, and deduplicate.
export function buildRenameListMulti(
  sourceNodes: TreeNode[],
  targetFolder: string
): RenameEntry[] {
  const seen = new Set<string>();
  const result: RenameEntry[] = [];

  for (const node of sourceNodes) {
    const entries = buildRenameList(node, targetFolder);
    for (const entry of entries) {
      if (!seen.has(entry.oldName)) {
        seen.add(entry.oldName);
        result.push(entry);
      }
    }
  }

  return result;
}

// Execute renames sequentially with a 50ms pause between each.
// Uses logseq.Editor.getPage to check for conflicts and renamePage to perform the rename.
export async function executeRenames(
  renameList: RenameEntry[]
): Promise<RenameResult> {
  const succeeded: RenameEntry[] = [];
  const failed: Array<RenameEntry & { error: string }> = [];

  for (let i = 0; i < renameList.length; i++) {
    const entry = renameList[i];

    try {
      // Check if target name already exists
      const existing = await logseq.Editor.getPage(entry.newName);
      if (existing) {
        failed.push({
          ...entry,
          error: `"${entry.newName}" already exists`,
        });
        continue;
      }

      await logseq.Editor.renamePage(entry.oldName, entry.newName);
      succeeded.push(entry);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      failed.push({ ...entry, error: message });
    }

    // Wait between renames to avoid blocking the UI thread
    if (i < renameList.length - 1) {
      await sleep(50);
    }
  }

  return { succeeded, failed };
}
