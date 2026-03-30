import type { TreeNode, PageEntity, SortConfig } from './types';
import { DEFAULT_SORT_CONFIG } from './types';

export function parseHiddenPages(raw: string | undefined): Set<string> {
  if (!raw || !raw.trim()) return new Set();
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function buildTree(
  pages: PageEntity[],
  sortConfig?: SortConfig,
  hiddenPages?: Set<string>,
): TreeNode[] {
  const root: TreeNode[] = [];

  for (const page of pages) {
    if (page['journal?']) continue;

    const originalName = page.originalName || page.name;
    const rootSegment = originalName.split('/')[0].trim().toLowerCase();
    if (hiddenPages && hiddenPages.size > 0 && hiddenPages.has(rootSegment)) continue;

    const parts = originalName.split('/').map((p) => p.trim());
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const fullPath = parts.slice(0, i + 1).join('/');
      const isLast = i === parts.length - 1;

      // Case-insensitive search to prevent duplicate nodes
      let existing = currentLevel.find((n) => n.name.toLowerCase() === part.toLowerCase());

      if (!existing) {
        existing = {
          name: part,
          displayName: part,
          fullPath,
          type: isLast ? 'page' : 'folder',
          children: [],
          originalName: isLast ? originalName : undefined,
          isExpanded: false,
          updatedAt: isLast && typeof page.updatedAt === 'number' ? page.updatedAt : undefined,
        };
        currentLevel.push(existing);
      } else if (isLast && existing.type === 'folder') {
        // Node was a folder, now also a page
        existing.type = 'both';
        existing.originalName = originalName;
        if (typeof page.updatedAt === 'number') {
          existing.updatedAt = page.updatedAt;
        }
      } else if (!isLast && existing.type === 'page') {
        // Node was a page, now also a folder (will get children)
        existing.type = 'both';
      }

      currentLevel = existing.children;
    }
  }

  propagateUpdatedAt(root);
  sortTree(root, sortConfig);
  return root;
}

export function propagateUpdatedAt(nodes: TreeNode[]): void {
  for (const node of nodes) {
    if (node.children.length > 0) {
      propagateUpdatedAt(node.children);
      let maxChild = 0;
      for (const child of node.children) {
        if ((child.updatedAt ?? 0) > maxChild) {
          maxChild = child.updatedAt ?? 0;
        }
      }
      const own = node.updatedAt ?? 0;
      node.updatedAt = Math.max(own, maxChild) || undefined;
    }
  }
}

export function sortTree(nodes: TreeNode[], config: SortConfig = DEFAULT_SORT_CONFIG): void {
  nodes.sort((a, b) => {
    if (config.foldersFirst) {
      const aIsFolder = a.children.length > 0 || a.type === 'folder' || a.type === 'both';
      const bIsFolder = b.children.length > 0 || b.type === 'folder' || b.type === 'both';
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
    }
    let cmp: number;
    if (config.key === 'updatedAt') {
      cmp = (a.updatedAt ?? 0) - (b.updatedAt ?? 0);
    } else {
      cmp = a.name.localeCompare(b.name);
    }
    return config.direction === 'desc' ? -cmp : cmp;
  });
  nodes.forEach((n) => sortTree(n.children, config));
}
