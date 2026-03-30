import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { useContextMenu } from '../../hooks/useContextMenu';
import type { TreeNode } from '../../types';

function makeNode(fullPath: string, type: TreeNode['type']): TreeNode {
  const parts = fullPath.split('/');
  return {
    name: parts[parts.length - 1],
    displayName: parts[parts.length - 1],
    fullPath,
    type,
    children: [],
    isExpanded: false,
  };
}

describe('useContextMenu', () => {
  it('opens menu with correct state', () => {
    const { result } = renderHook(() => useContextMenu());
    const node = makeNode('dev/react', 'page');

    act(() => {
      result.current.openMenu(node, 100, 200);
    });

    expect(result.current.menu.visible).toBe(true);
    expect(result.current.menu.x).toBe(100);
    expect(result.current.menu.y).toBe(200);
    expect(result.current.menu.node).toBe(node);
  });

  it('closes menu', () => {
    const { result } = renderHook(() => useContextMenu());
    const node = makeNode('dev/react', 'page');

    act(() => {
      result.current.openMenu(node, 100, 200);
    });

    act(() => {
      result.current.closeMenu();
    });

    expect(result.current.menu.visible).toBe(false);
    expect(result.current.menu.node).toBeNull();
  });

  it('closes on Escape key', () => {
    const { result } = renderHook(() => useContextMenu());
    const node = makeNode('dev/react', 'page');

    act(() => {
      result.current.openMenu(node, 100, 200);
    });

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(result.current.menu.visible).toBe(false);
  });
});
