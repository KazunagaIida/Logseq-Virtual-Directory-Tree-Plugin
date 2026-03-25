import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import type { TreeNode, PageEntity } from '../types';
import { buildTree } from '../tree';
import { debounce } from '../utils/debounce';

function applyExpandedState(
  nodes: TreeNode[],
  expandedSet: Set<string>
): void {
  for (const node of nodes) {
    if (expandedSet.has(node.fullPath.toLowerCase())) {
      node.isExpanded = true;
    }
    applyExpandedState(node.children, expandedSet);
  }
}

function collectExpandedPaths(nodes: TreeNode[]): string[] {
  const paths: string[] = [];
  for (const node of nodes) {
    if (node.isExpanded) {
      paths.push(node.fullPath);
    }
    paths.push(...collectExpandedPaths(node.children));
  }
  return paths;
}

function toggleNodeExpanded(
  nodes: TreeNode[],
  fullPath: string
): TreeNode[] {
  return nodes.map((node) => {
    if (node.fullPath === fullPath) {
      return { ...node, isExpanded: !node.isExpanded };
    }
    if (node.children.length > 0) {
      return { ...node, children: toggleNodeExpanded(node.children, fullPath) };
    }
    return node;
  });
}

export function useTree() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const expandedRef = useRef<Set<string>>(new Set());

  const loadTree = useCallback(async () => {
    try {
      const pages =
        (await logseq.Editor.getAllPages()) as PageEntity[] | null;
      if (!pages) {
        setTree([]);
        return;
      }

      const newTree = buildTree(pages);

      // Restore expanded state
      const saved = logseq.settings?.expandedFolders as string[] | undefined;
      if (saved && expandedRef.current.size === 0) {
        expandedRef.current = new Set(saved.map((s) => s.toLowerCase()));
      }
      applyExpandedState(newTree, expandedRef.current);

      setTree(newTree);
    } catch (err) {
      console.error('Failed to load tree:', err);
    }
  }, []);

  useEffect(() => {
    loadTree();

    const debouncedReload = debounce(() => {
      loadTree();
    }, 300);

    const off = logseq.DB.onChanged(debouncedReload);

    return () => {
      if (typeof off === 'function') off();
    };
  }, [loadTree]);

  const toggle = useCallback(
    (fullPath: string) => {
      setTree((prev) => {
        const updated = toggleNodeExpanded(prev, fullPath);

        // Update expanded set
        const lower = fullPath.toLowerCase();
        if (expandedRef.current.has(lower)) {
          expandedRef.current.delete(lower);
        } else {
          expandedRef.current.add(lower);
        }

        // Persist
        const paths = collectExpandedPaths(updated);
        logseq.updateSettings({ expandedFolders: paths });

        return updated;
      });
    },
    []
  );

  const navigate = useCallback((fullPath: string) => {
    logseq.App.pushState('page', { name: fullPath });
  }, []);

  return { tree, toggle, navigate, reload: loadTree };
}
