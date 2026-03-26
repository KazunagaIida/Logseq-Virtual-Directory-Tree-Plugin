import type { TreeNode, PageEntity } from './types';

export function buildTree(pages: PageEntity[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const page of pages) {
    if (page['journal?']) continue;

    const originalName = page.originalName || page.name;
    const parts = originalName.split('/').map((p) => p.trim());
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const fullPath = parts.slice(0, i + 1).join('/');
      const isLast = i === parts.length - 1;

      // Case-insensitive search to prevent duplicate nodes
      let existing = currentLevel.find(
        (n) => n.name.toLowerCase() === part.toLowerCase()
      );

      if (!existing) {
        existing = {
          name: part,
          displayName: part,
          fullPath,
          type: isLast ? 'page' : 'folder',
          children: [],
          isExpanded: false,
        };
        currentLevel.push(existing);
      } else if (isLast && existing.type === 'folder') {
        // Node was a folder, now also a page
        existing.type = 'both';
      } else if (!isLast && existing.type === 'page') {
        // Node was a page, now also a folder (will get children)
        existing.type = 'both';
      }

      currentLevel = existing.children;
    }
  }

  sortTree(root);
  return root;
}

export function sortTree(nodes: TreeNode[]): void {
  nodes.sort((a, b) => {
    const aIsFolder =
      a.children.length > 0 || a.type === 'folder' || a.type === 'both';
    const bIsFolder =
      b.children.length > 0 || b.type === 'folder' || b.type === 'both';
    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;
    return a.name.localeCompare(b.name);
  });
  nodes.forEach((n) => sortTree(n.children));
}
