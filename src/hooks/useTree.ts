import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import type { TreeNode, PageEntity } from '../types';
import { buildTree } from '../tree';
import { debounce } from '../utils/debounce';
import { hasTreeChanged } from '../utils/treeDiff';

const POLL_INTERVAL = 5000;

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

// Expand all ancestor folders of a given fullPath
function expandAncestors(
  nodes: TreeNode[],
  fullPath: string,
  expandedSet: Set<string>
): TreeNode[] {
  const parts = fullPath.split('/');
  // Build ancestor paths: for "a/b/c" -> ["a", "a/b"]
  const ancestorPaths = parts.slice(0, -1).map((_, i) =>
    parts.slice(0, i + 1).join('/')
  );

  function expand(nodes: TreeNode[]): TreeNode[] {
    return nodes.map((node) => {
      const shouldExpand = ancestorPaths.some(
        (p) => p.toLowerCase() === node.fullPath.toLowerCase()
      );
      if (shouldExpand) {
        expandedSet.add(node.fullPath.toLowerCase());
        return {
          ...node,
          isExpanded: true,
          children: expand(node.children),
        };
      }
      if (node.children.length > 0) {
        return { ...node, children: expand(node.children) };
      }
      return node;
    });
  }

  return expand(nodes);
}

// Check if a node exists in the tree
function nodeExists(nodes: TreeNode[], fullPath: string): boolean {
  for (const node of nodes) {
    if (node.fullPath.toLowerCase() === fullPath.toLowerCase()) return true;
    if (nodeExists(node.children, fullPath)) return true;
  }
  return false;
}

export interface UseTreeOptions {
  visible?: boolean;
  isBusy?: () => boolean;
}

export function useTree(options: UseTreeOptions = {}) {
  const { visible = true, isBusy } = options;
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const expandedRef = useRef<Set<string>>(new Set());
  const activeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const treeRef = useRef<TreeNode[]>([]);

  const loadTree = useCallback(async () => {
    // Skip reload if busy
    if (isBusy && isBusy()) return;

    try {
      const pages =
        (await logseq.Editor.getAllPages()) as PageEntity[] | null;
      if (!pages) {
        if (treeRef.current.length > 0) {
          treeRef.current = [];
          setTree([]);
        }
        return;
      }

      const newTree = buildTree(pages);

      // Restore expanded state
      const saved = logseq.settings?.expandedFolders as string[] | undefined;
      if (saved && expandedRef.current.size === 0) {
        expandedRef.current = new Set(saved.map((s) => s.toLowerCase()));
      }
      applyExpandedState(newTree, expandedRef.current);

      // Only update if tree content actually changed
      if (!hasTreeChanged(treeRef.current, newTree)) return;

      treeRef.current = newTree;
      setTree(newTree);
    } catch (err) {
      console.error('Failed to load tree:', err);
    }
  }, [isBusy]);

  // Initial load + DB.onChanged listener
  useEffect(() => {
    if (!visible) return;

    loadTree();

    const debouncedReload = debounce(() => {
      loadTree();
    }, 300);

    const off = logseq.DB.onChanged(debouncedReload);

    return () => {
      if (typeof off === 'function') off();
    };
  }, [loadTree, visible]);

  // Polling while visible
  useEffect(() => {
    if (!visible) return;

    const id = setInterval(() => {
      loadTree();
    }, POLL_INTERVAL);

    return () => clearInterval(id);
  }, [visible, loadTree]);

  // Delayed reload for post-operation retry
  const delayedReload = useCallback(() => {
    setTimeout(() => {
      // Force reload regardless of busy state for post-operation retry
      (async () => {
        try {
          const pages =
            (await logseq.Editor.getAllPages()) as PageEntity[] | null;
          if (!pages) {
            treeRef.current = [];
            setTree([]);
            return;
          }
          const newTree = buildTree(pages);
          const saved = logseq.settings?.expandedFolders as string[] | undefined;
          if (saved && expandedRef.current.size === 0) {
            expandedRef.current = new Set(saved.map((s) => s.toLowerCase()));
          }
          applyExpandedState(newTree, expandedRef.current);
          if (!hasTreeChanged(treeRef.current, newTree)) return;
          treeRef.current = newTree;
          setTree(newTree);
        } catch (err) {
          console.error('Failed to load tree (delayed):', err);
        }
      })();
    }, 500);
  }, []);

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

        treeRef.current = updated;
        return updated;
      });
    },
    []
  );

  const navigate = useCallback((fullPath: string) => {
    logseq.App.pushState('page', { name: fullPath });
  }, []);

  const revealPage = useCallback((fullPath: string) => {
    let found = false;

    setTree((prev) => {
      if (!nodeExists(prev, fullPath)) return prev;

      found = true;
      const updated = expandAncestors(prev, fullPath, expandedRef.current);

      // Persist expanded state
      const paths = collectExpandedPaths(updated);
      logseq.updateSettings({ expandedFolders: paths });

      treeRef.current = updated;
      return updated;
    });

    if (!found) return;

    // Set active node with auto-clear
    setActiveNode(fullPath);
    if (activeTimerRef.current) clearTimeout(activeTimerRef.current);
    activeTimerRef.current = setTimeout(() => {
      setActiveNode(null);
      activeTimerRef.current = null;
    }, 2000);
  }, []);

  const expandAll = useCallback(() => {
    setTree((prev) => {
      function setAll(nodes: TreeNode[]): TreeNode[] {
        return nodes.map((node) => {
          if (node.children.length > 0) {
            expandedRef.current.add(node.fullPath.toLowerCase());
            return { ...node, isExpanded: true, children: setAll(node.children) };
          }
          return node;
        });
      }
      const updated = setAll(prev);
      logseq.updateSettings({ expandedFolders: collectExpandedPaths(updated) });
      treeRef.current = updated;
      return updated;
    });
  }, []);

  const collapseAll = useCallback(() => {
    setTree((prev) => {
      function setAll(nodes: TreeNode[]): TreeNode[] {
        return nodes.map((node) => {
          if (node.children.length > 0) {
            return { ...node, isExpanded: false, children: setAll(node.children) };
          }
          return node;
        });
      }
      expandedRef.current.clear();
      const updated = setAll(prev);
      logseq.updateSettings({ expandedFolders: [] });
      treeRef.current = updated;
      return updated;
    });
  }, []);

  return { tree, activeNode, toggle, navigate, reload: loadTree, delayedReload, revealPage, expandAll, collapseAll };
}
