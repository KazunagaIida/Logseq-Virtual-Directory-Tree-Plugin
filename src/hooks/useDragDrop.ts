import { useState, useCallback, useRef } from 'preact/hooks';
import type { TreeNode } from '../types';
import { checkCircularDrop } from '../utils/validation';
import { buildRenameList, buildRenameListMulti, executeRenames } from '../utils/rename';
import { expandIframeForDialog, shrinkIframeToPanel } from '../utils/panelLayout';
import type { RenameEntry, RenameResult } from '../utils/rename';

export interface DragDropState {
  dropTarget: string | null;
  isLoading: boolean;
  sourceCount: number; // number of items being dragged
  confirmDialog: {
    visible: boolean;
    sourceNode: TreeNode | null;
    sourceNodes: TreeNode[];
    targetPath: string;
    renameList: RenameEntry[];
  };
  resultDialog: {
    visible: boolean;
    result: RenameResult | null;
  };
}

function findNode(nodes: TreeNode[], fullPath: string): TreeNode | null {
  for (const node of nodes) {
    if (node.fullPath === fullPath) return node;
    const found = findNode(node.children, fullPath);
    if (found) return found;
  }
  return null;
}

export function useDragDrop(
  tree: TreeNode[],
  onComplete: () => void,
  selectedPaths?: Set<string>,
  clearSelection?: () => void,
  onDelayedReload?: () => void,
) {
  const dragSourcesRef = useRef<TreeNode[]>([]);
  const [state, setState] = useState<DragDropState>({
    dropTarget: null,
    isLoading: false,
    sourceCount: 0,
    confirmDialog: {
      visible: false,
      sourceNode: null,
      sourceNodes: [],
      targetPath: '',
      renameList: [],
    },
    resultDialog: { visible: false, result: null },
  });

  const canDropAny = useCallback((sources: TreeNode[], targetFullPath: string): boolean => {
    if (targetFullPath === '__root__') return true;
    // At least one source can be dropped
    return sources.some((s) => !checkCircularDrop(s.fullPath, targetFullPath));
  }, []);

  const onDragStart = useCallback(
    (node: TreeNode, e: DragEvent) => {
      if (!e.dataTransfer) return;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', node.fullPath);

      // If the dragged node is selected, drag all selected nodes
      if (selectedPaths && selectedPaths.has(node.fullPath) && selectedPaths.size > 1) {
        const sources: TreeNode[] = [];
        for (const path of selectedPaths) {
          const found = findNode(tree, path);
          if (found) sources.push(found);
        }
        dragSourcesRef.current = sources;
        setState((prev) => ({ ...prev, sourceCount: sources.length }));

        // Custom drag ghost showing item count
        const ghost = document.createElement('div');
        ghost.textContent = `${sources.length} items`;
        const accent =
          getComputedStyle(document.documentElement).getPropertyValue('--vdt-accent').trim() ||
          '#3898ff';
        ghost.style.cssText = `padding: 4px 12px; background: ${accent}; color: #fff; border-radius: 4px; font-size: 13px; font-family: sans-serif; position: absolute; top: -1000px; white-space: nowrap;`;
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 0, 0);
        setTimeout(() => document.body.removeChild(ghost), 0);
      } else {
        // Single drag (unselected node or single selection)
        dragSourcesRef.current = [node];
        clearSelection?.();
        setState((prev) => ({ ...prev, sourceCount: 1 }));
      }
    },
    [tree, selectedPaths, clearSelection],
  );

  const onDragOver = useCallback(
    (targetFullPath: string, e: DragEvent) => {
      e.preventDefault();
      if (!e.dataTransfer) return;

      const sources = dragSourcesRef.current;
      if (sources.length === 0) return;

      if (canDropAny(sources, targetFullPath)) {
        e.dataTransfer.dropEffect = 'move';
        setState((prev) => ({ ...prev, dropTarget: targetFullPath }));
      } else {
        e.dataTransfer.dropEffect = 'none';
      }
    },
    [canDropAny],
  );

  const onDragLeave = useCallback(() => {
    setState((prev) => ({ ...prev, dropTarget: null }));
  }, []);

  const onDragEnd = useCallback(() => {
    // Also handles Escape: browser cancels drag natively and fires dragend
    dragSourcesRef.current = [];
    setState((prev) => ({ ...prev, dropTarget: null, sourceCount: 0 }));
  }, []);

  const onDrop = useCallback(
    (targetFullPath: string, e: DragEvent) => {
      e.preventDefault();
      const sources = dragSourcesRef.current;
      if (sources.length === 0) return;

      const targetPath = targetFullPath === '__root__' ? '' : targetFullPath;

      // Filter out sources that would cause circular drops
      const validSources = sources.filter((s) => {
        if (targetFullPath === '__root__') return true;
        return !checkCircularDrop(s.fullPath, targetFullPath);
      });

      if (validSources.length === 0) {
        dragSourcesRef.current = [];
        return;
      }

      const renameList =
        validSources.length === 1
          ? buildRenameList(validSources[0], targetPath)
          : buildRenameListMulti(validSources, targetPath);

      dragSourcesRef.current = [];

      // All renames are no-ops (e.g. dropping onto own parent folder)
      if (renameList.length === 0) return;

      clearSelection?.();
      expandIframeForDialog();
      setState((prev) => ({
        ...prev,
        dropTarget: null,
        sourceCount: 0,
        confirmDialog: {
          visible: true,
          sourceNode: validSources[0],
          sourceNodes: validSources,
          targetPath,
          renameList,
        },
      }));
    },
    [clearSelection],
  );

  const confirmMove = useCallback(async () => {
    const { renameList } = state.confirmDialog;
    setState((prev) => ({
      ...prev,
      confirmDialog: { ...prev.confirmDialog, visible: false },
      isLoading: true,
    }));

    const result = await executeRenames(renameList);

    // Try re-index
    try {
      await logseq.App.invokeExternalCommand(
        'logseq.search/re-index' as unknown as Parameters<
          typeof logseq.App.invokeExternalCommand
        >[0],
      );
    } catch {
      // re-index not critical
    }

    setState((prev) => ({
      ...prev,
      isLoading: false,
      resultDialog: {
        visible: result.failed.length > 0,
        result,
      },
    }));

    if (result.failed.length === 0) {
      shrinkIframeToPanel();
    }

    onComplete();
    onDelayedReload?.();
  }, [state.confirmDialog, onComplete, onDelayedReload]);

  const cancelMove = useCallback(() => {
    setState((prev) => ({
      ...prev,
      confirmDialog: {
        visible: false,
        sourceNode: null,
        sourceNodes: [],
        targetPath: '',
        renameList: [],
      },
    }));
    shrinkIframeToPanel();
  }, []);

  const closeResultDialog = useCallback(() => {
    setState((prev) => ({
      ...prev,
      resultDialog: { visible: false, result: null },
    }));
    shrinkIframeToPanel();
  }, []);

  return {
    state,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDragEnd,
    onDrop,
    confirmMove,
    cancelMove,
    closeResultDialog,
  };
}
