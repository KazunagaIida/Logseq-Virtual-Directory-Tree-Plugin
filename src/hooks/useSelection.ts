import { useState, useCallback, useRef } from 'preact/hooks';
import type { TreeNode } from '../types';

// Flatten tree into display order (only visible nodes: expanded folders show children)
function flattenTree(nodes: TreeNode[]): string[] {
  const result: string[] = [];
  for (const node of nodes) {
    result.push(node.fullPath);
    if (node.isExpanded && node.children.length > 0) {
      result.push(...flattenTree(node.children));
    }
  }
  return result;
}

export function useSelection(tree: TreeNode[]) {
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const lastSelectedRef = useRef<string | null>(null);

  const isSelected = useCallback(
    (fullPath: string) => selectedPaths.has(fullPath),
    [selectedPaths],
  );

  const toggleSelect = useCallback(
    (fullPath: string, ctrlKey: boolean, shiftKey: boolean) => {
      setSelectedPaths((prev) => {
        if (shiftKey && lastSelectedRef.current) {
          // Range select: from last selected to current, in display order
          const flat = flattenTree(tree);
          const startIdx = flat.indexOf(lastSelectedRef.current);
          const endIdx = flat.indexOf(fullPath);
          if (startIdx === -1 || endIdx === -1) {
            // Fallback: just select this node
            lastSelectedRef.current = fullPath;
            return new Set([fullPath]);
          }
          const lo = Math.min(startIdx, endIdx);
          const hi = Math.max(startIdx, endIdx);
          const next = new Set(prev);
          for (let i = lo; i <= hi; i++) {
            next.add(flat[i]);
          }
          // Don't update lastSelectedRef for shift-click (anchor stays)
          return next;
        }

        if (ctrlKey) {
          // Toggle individual
          const next = new Set(prev);
          if (next.has(fullPath)) {
            next.delete(fullPath);
          } else {
            next.add(fullPath);
          }
          lastSelectedRef.current = fullPath;
          return next;
        }

        // Plain click: reset and select only this
        lastSelectedRef.current = fullPath;
        return new Set([fullPath]);
      });
    },
    [tree],
  );

  const clearSelection = useCallback(() => {
    setSelectedPaths(new Set());
    lastSelectedRef.current = null;
  }, []);

  return { selectedPaths, isSelected, toggleSelect, clearSelection };
}
