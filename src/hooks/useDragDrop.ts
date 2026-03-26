import { useState, useCallback, useRef } from 'preact/hooks';
import type { TreeNode } from '../types';
import { checkCircularDrop } from '../utils/validation';
import { buildRenameList, executeRenames } from '../utils/rename';
import type { RenameEntry, RenameResult } from '../utils/rename';

export interface DragDropState {
  dropTarget: string | null; // fullPath of the drop target, or '__root__' for root
  isLoading: boolean;
  confirmDialog: {
    visible: boolean;
    sourceNode: TreeNode | null;
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

export function useDragDrop(tree: TreeNode[], onComplete: () => void) {
  const dragSourceRef = useRef<TreeNode | null>(null);
  const [state, setState] = useState<DragDropState>({
    dropTarget: null,
    isLoading: false,
    confirmDialog: { visible: false, sourceNode: null, targetPath: '', renameList: [] },
    resultDialog: { visible: false, result: null },
  });

  const canDrop = useCallback(
    (sourceFullPath: string, targetFullPath: string): boolean => {
      if (targetFullPath === '__root__') return true;
      return !checkCircularDrop(sourceFullPath, targetFullPath);
    },
    []
  );

  const onDragStart = useCallback(
    (node: TreeNode, e: DragEvent) => {
      if (!e.dataTransfer) return;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', node.fullPath);
      dragSourceRef.current = node;
    },
    []
  );

  const onDragOver = useCallback(
    (targetFullPath: string, e: DragEvent) => {
      e.preventDefault();
      if (!e.dataTransfer) return;

      const source = dragSourceRef.current;
      if (!source) return;

      if (canDrop(source.fullPath, targetFullPath)) {
        e.dataTransfer.dropEffect = 'move';
        setState((prev) => ({ ...prev, dropTarget: targetFullPath }));
      } else {
        e.dataTransfer.dropEffect = 'none';
      }
    },
    [canDrop]
  );

  const onDragLeave = useCallback(() => {
    setState((prev) => ({ ...prev, dropTarget: null }));
  }, []);

  const onDragEnd = useCallback(() => {
    dragSourceRef.current = null;
    setState((prev) => ({ ...prev, dropTarget: null }));
  }, []);

  const onDrop = useCallback(
    (targetFullPath: string, e: DragEvent) => {
      e.preventDefault();
      const sourceNode = dragSourceRef.current;
      if (!sourceNode) return;

      if (!canDrop(sourceNode.fullPath, targetFullPath)) return;

      const targetPath = targetFullPath === '__root__' ? '' : targetFullPath;
      const renameList = buildRenameList(sourceNode, targetPath);

      dragSourceRef.current = null;
      setState((prev) => ({
        ...prev,
        dropTarget: null,
        confirmDialog: {
          visible: true,
          sourceNode,
          targetPath,
          renameList,
        },
      }));
    },
    [canDrop]
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
        'logseq.search/re-index' as any
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

    onComplete();
  }, [state.confirmDialog, onComplete]);

  const cancelMove = useCallback(() => {
    setState((prev) => ({
      ...prev,
      confirmDialog: { visible: false, sourceNode: null, targetPath: '', renameList: [] },
    }));
  }, []);

  const closeResultDialog = useCallback(() => {
    setState((prev) => ({
      ...prev,
      resultDialog: { visible: false, result: null },
    }));
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
