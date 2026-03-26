import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { useSelection } from '../../hooks/useSelection';
import type { TreeNode } from '../../types';

function makeNode(
  fullPath: string,
  type: TreeNode['type'],
  children: TreeNode[] = [],
  isExpanded = true
): TreeNode {
  const parts = fullPath.split('/');
  return {
    name: parts[parts.length - 1],
    displayName: parts[parts.length - 1],
    fullPath,
    type,
    children,
    isExpanded,
  };
}

// Tree structure (all expanded for range selection):
// dev/           (folder)
//   dev/react    (page)
//   dev/ts       (page)
// cooking/       (folder)
//   cooking/sv   (page)
// memo           (page)
const tree: TreeNode[] = [
  makeNode('dev', 'folder', [
    makeNode('dev/react', 'page'),
    makeNode('dev/ts', 'page'),
  ]),
  makeNode('cooking', 'folder', [
    makeNode('cooking/sv', 'page'),
  ]),
  makeNode('memo', 'page'),
];

describe('useSelection', () => {
  it('plain click selects only that node', () => {
    const { result } = renderHook(() => useSelection(tree));

    act(() => {
      result.current.toggleSelect('dev/react', false, false);
    });

    expect(result.current.isSelected('dev/react')).toBe(true);
    expect(result.current.isSelected('dev/ts')).toBe(false);
    expect(result.current.isSelected('memo')).toBe(false);
  });

  it('plain click resets previous selection', () => {
    const { result } = renderHook(() => useSelection(tree));

    act(() => {
      result.current.toggleSelect('dev/react', false, false);
    });
    act(() => {
      result.current.toggleSelect('memo', false, false);
    });

    expect(result.current.isSelected('dev/react')).toBe(false);
    expect(result.current.isSelected('memo')).toBe(true);
  });

  it('ctrl+click toggles individual selection', () => {
    const { result } = renderHook(() => useSelection(tree));

    // Select first
    act(() => {
      result.current.toggleSelect('dev/react', true, false);
    });
    expect(result.current.isSelected('dev/react')).toBe(true);

    // Add second
    act(() => {
      result.current.toggleSelect('memo', true, false);
    });
    expect(result.current.isSelected('dev/react')).toBe(true);
    expect(result.current.isSelected('memo')).toBe(true);

    // Deselect first
    act(() => {
      result.current.toggleSelect('dev/react', true, false);
    });
    expect(result.current.isSelected('dev/react')).toBe(false);
    expect(result.current.isSelected('memo')).toBe(true);
  });

  it('shift+click selects range in display order', () => {
    const { result } = renderHook(() => useSelection(tree));

    // First click sets anchor
    act(() => {
      result.current.toggleSelect('dev/react', false, false);
    });

    // Shift+click selects range from dev/react to cooking/sv
    // Display order: dev, dev/react, dev/ts, cooking, cooking/sv, memo
    act(() => {
      result.current.toggleSelect('cooking/sv', false, true);
    });

    expect(result.current.isSelected('dev/react')).toBe(true);
    expect(result.current.isSelected('dev/ts')).toBe(true);
    expect(result.current.isSelected('cooking')).toBe(true);
    expect(result.current.isSelected('cooking/sv')).toBe(true);
    // Not in range:
    expect(result.current.isSelected('dev')).toBe(false);
    expect(result.current.isSelected('memo')).toBe(false);
  });

  it('clearSelection deselects all', () => {
    const { result } = renderHook(() => useSelection(tree));

    act(() => {
      result.current.toggleSelect('dev/react', true, false);
    });
    act(() => {
      result.current.toggleSelect('memo', true, false);
    });
    expect(result.current.isSelected('dev/react')).toBe(true);
    expect(result.current.isSelected('memo')).toBe(true);

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.isSelected('dev/react')).toBe(false);
    expect(result.current.isSelected('memo')).toBe(false);
  });
});
