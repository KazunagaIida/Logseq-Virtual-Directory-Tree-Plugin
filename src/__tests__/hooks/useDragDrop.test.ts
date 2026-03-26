import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { useDragDrop } from '../../hooks/useDragDrop';
import type { TreeNode } from '../../types';

function makeNode(
  fullPath: string,
  type: TreeNode['type'],
  children: TreeNode[] = []
): TreeNode {
  const parts = fullPath.split('/');
  return {
    name: parts[parts.length - 1],
    displayName: parts[parts.length - 1],
    fullPath,
    type,
    children,
    isExpanded: false,
  };
}

function makeDragEvent(overrides?: Partial<DragEvent>): DragEvent {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    dataTransfer: {
      effectAllowed: 'uninitialized',
      dropEffect: 'none',
      setData: vi.fn(),
    },
    ...overrides,
  } as unknown as DragEvent;
}

describe('useDragDrop', () => {
  const onComplete = vi.fn();

  const tree: TreeNode[] = [
    makeNode('dev', 'folder', [
      makeNode('dev/react', 'both', [
        makeNode('dev/react/hooks', 'page'),
      ]),
      makeNode('dev/typescript', 'folder', [
        makeNode('dev/typescript/generics', 'page'),
      ]),
    ]),
    makeNode('cooking', 'folder', [
      makeNode('cooking/sous-vide', 'page'),
    ]),
    makeNode('memo', 'page'),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    (logseq.Editor.getPage as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (logseq.Editor.renamePage as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (logseq.App.invokeExternalCommand as any) = vi.fn().mockResolvedValue(undefined);
  });

  it('rejects dropping onto itself', () => {
    const { result } = renderHook(() => useDragDrop(tree, onComplete));
    const sourceNode = tree[0].children[0]; // dev/react

    act(() => {
      result.current.onDragStart(sourceNode, makeDragEvent());
    });

    const dragOverEvent = makeDragEvent();
    act(() => {
      result.current.onDragOver('dev/react', dragOverEvent);
    });

    expect(dragOverEvent.dataTransfer!.dropEffect).toBe('none');
  });

  it('rejects dropping into a descendant folder', () => {
    const { result } = renderHook(() => useDragDrop(tree, onComplete));
    const sourceNode = tree[0]; // dev

    act(() => {
      result.current.onDragStart(sourceNode, makeDragEvent());
    });

    const dragOverEvent = makeDragEvent();
    act(() => {
      result.current.onDragOver('dev/react', dragOverEvent);
    });

    expect(dragOverEvent.dataTransfer!.dropEffect).toBe('none');
  });

  it('allows dropping into a normal folder', () => {
    const { result } = renderHook(() => useDragDrop(tree, onComplete));
    const sourceNode = tree[0].children[0].children[0]; // dev/react/hooks

    act(() => {
      result.current.onDragStart(sourceNode, makeDragEvent());
    });

    const dragOverEvent = makeDragEvent();
    act(() => {
      result.current.onDragOver('cooking', dragOverEvent);
    });

    expect(dragOverEvent.dataTransfer!.dropEffect).toBe('move');
  });

  it('allows dropping to root', () => {
    const { result } = renderHook(() => useDragDrop(tree, onComplete));
    const sourceNode = tree[0].children[0].children[0]; // dev/react/hooks

    act(() => {
      result.current.onDragStart(sourceNode, makeDragEvent());
    });

    const dragOverEvent = makeDragEvent();
    act(() => {
      result.current.onDragOver('__root__', dragOverEvent);
    });

    expect(dragOverEvent.dataTransfer!.dropEffect).toBe('move');
  });

  it('shows confirm dialog on drop', () => {
    const { result } = renderHook(() => useDragDrop(tree, onComplete));
    const sourceNode = tree[0].children[0].children[0]; // dev/react/hooks

    act(() => {
      result.current.onDragStart(sourceNode, makeDragEvent());
    });

    act(() => {
      result.current.onDrop('cooking', makeDragEvent());
    });

    expect(result.current.state.confirmDialog.visible).toBe(true);
    expect(result.current.state.confirmDialog.sourceNode).toBe(sourceNode);
    expect(result.current.state.confirmDialog.renameList).toHaveLength(1);
    expect(result.current.state.confirmDialog.renameList[0]).toEqual({
      oldName: 'dev/react/hooks',
      newName: 'cooking/hooks',
    });
  });

  it('calls executeRenames after confirm', async () => {
    const { result } = renderHook(() => useDragDrop(tree, onComplete));
    const sourceNode = tree[0].children[0].children[0]; // dev/react/hooks

    act(() => {
      result.current.onDragStart(sourceNode, makeDragEvent());
    });

    act(() => {
      result.current.onDrop('cooking', makeDragEvent());
    });

    await act(async () => {
      await result.current.confirmMove();
    });

    expect(logseq.Editor.renamePage).toHaveBeenCalledWith(
      'dev/react/hooks',
      'cooking/hooks'
    );
    expect(onComplete).toHaveBeenCalled();
  });

  it('does not call executeRenames on cancel', () => {
    const { result } = renderHook(() => useDragDrop(tree, onComplete));
    const sourceNode = tree[0].children[0].children[0]; // dev/react/hooks

    act(() => {
      result.current.onDragStart(sourceNode, makeDragEvent());
    });

    act(() => {
      result.current.onDrop('cooking', makeDragEvent());
    });

    act(() => {
      result.current.cancelMove();
    });

    expect(result.current.state.confirmDialog.visible).toBe(false);
    expect(logseq.Editor.renamePage).not.toHaveBeenCalled();
  });

  it('does not show confirm dialog when drop is rejected', () => {
    const { result } = renderHook(() => useDragDrop(tree, onComplete));
    const sourceNode = tree[0]; // dev

    act(() => {
      result.current.onDragStart(sourceNode, makeDragEvent());
    });

    // Try dropping dev into dev/react (descendant)
    act(() => {
      result.current.onDrop('dev/react', makeDragEvent());
    });

    expect(result.current.state.confirmDialog.visible).toBe(false);
  });

  describe('multi-select drag & drop', () => {
    it('drags all selected nodes when dragging a selected node', () => {
      const selected = new Set(['dev/react/hooks', 'dev/typescript/generics']);
      const clearSel = vi.fn();
      const { result } = renderHook(() =>
        useDragDrop(tree, onComplete, selected, clearSel)
      );
      const sourceNode = tree[0].children[0].children[0]; // dev/react/hooks

      act(() => {
        result.current.onDragStart(sourceNode, makeDragEvent());
      });

      // Drop onto cooking
      act(() => {
        result.current.onDrop('cooking', makeDragEvent());
      });

      // Both nodes should be in the rename list
      expect(result.current.state.confirmDialog.visible).toBe(true);
      expect(result.current.state.confirmDialog.renameList.length).toBeGreaterThanOrEqual(2);
      const oldNames = result.current.state.confirmDialog.renameList.map((r) => r.oldName);
      expect(oldNames).toContain('dev/react/hooks');
      expect(oldNames).toContain('dev/typescript/generics');
    });

    it('drags only the single node when dragging an unselected node', () => {
      const selected = new Set(['dev/react/hooks', 'dev/typescript/generics']);
      const clearSel = vi.fn();
      const { result } = renderHook(() =>
        useDragDrop(tree, onComplete, selected, clearSel)
      );
      const unselectedNode = tree[2]; // memo (not selected)

      act(() => {
        result.current.onDragStart(unselectedNode, makeDragEvent());
      });

      expect(clearSel).toHaveBeenCalled();

      act(() => {
        result.current.onDrop('cooking', makeDragEvent());
      });

      expect(result.current.state.confirmDialog.renameList).toHaveLength(1);
      expect(result.current.state.confirmDialog.renameList[0].oldName).toBe('memo');
    });

    it('skips circular sources but moves others', () => {
      // Select dev (parent) and memo (unrelated)
      const selected = new Set(['dev', 'memo']);
      const clearSel = vi.fn();
      const { result } = renderHook(() =>
        useDragDrop(tree, onComplete, selected, clearSel)
      );

      act(() => {
        result.current.onDragStart(tree[0], makeDragEvent()); // dev
      });

      // Drop onto dev/react — dev is circular, memo is fine
      act(() => {
        result.current.onDrop('dev/react', makeDragEvent());
      });

      expect(result.current.state.confirmDialog.visible).toBe(true);
      const oldNames = result.current.state.confirmDialog.renameList.map((r) => r.oldName);
      expect(oldNames).toContain('memo');
      expect(oldNames).not.toContain('dev');
    });
  });
});
