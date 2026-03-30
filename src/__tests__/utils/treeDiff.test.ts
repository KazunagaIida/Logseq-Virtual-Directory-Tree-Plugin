import { describe, it, expect } from 'vitest';
import { hasTreeChanged } from '../../utils/treeDiff';
import type { TreeNode } from '../../types';

function makeNode(
  fullPath: string,
  type: TreeNode['type'] = 'page',
  children: TreeNode[] = [],
  isExpanded = false
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

describe('hasTreeChanged', () => {
  it('returns false for identical trees', () => {
    const tree = [
      makeNode('dev', 'folder', [
        makeNode('dev/react', 'page'),
        makeNode('dev/vue', 'page'),
      ]),
      makeNode('memo', 'page'),
    ];
    const same = [
      makeNode('dev', 'folder', [
        makeNode('dev/react', 'page'),
        makeNode('dev/vue', 'page'),
      ]),
      makeNode('memo', 'page'),
    ];
    expect(hasTreeChanged(tree, same)).toBe(false);
  });

  it('returns true when a page is added', () => {
    const old = [makeNode('memo', 'page')];
    const next = [makeNode('memo', 'page'), makeNode('notes', 'page')];
    expect(hasTreeChanged(old, next)).toBe(true);
  });

  it('returns true when a page is removed', () => {
    const old = [makeNode('memo', 'page'), makeNode('notes', 'page')];
    const next = [makeNode('memo', 'page')];
    expect(hasTreeChanged(old, next)).toBe(true);
  });

  it('returns true when a page is renamed', () => {
    const old = [makeNode('memo', 'page')];
    const next = [makeNode('notes', 'page')];
    expect(hasTreeChanged(old, next)).toBe(true);
  });

  it('returns true when node type changes (page → both)', () => {
    const old = [makeNode('dev', 'page')];
    const next = [makeNode('dev', 'both')];
    expect(hasTreeChanged(old, next)).toBe(true);
  });

  it('returns false when only expansion state differs', () => {
    const old = [makeNode('dev', 'folder', [makeNode('dev/react', 'page')], false)];
    const next = [makeNode('dev', 'folder', [makeNode('dev/react', 'page')], true)];
    expect(hasTreeChanged(old, next)).toBe(false);
  });

  it('returns false for two empty trees', () => {
    expect(hasTreeChanged([], [])).toBe(false);
  });

  it('returns true when order changes (sort direction)', () => {
    const old = [makeNode('apple', 'page'), makeNode('banana', 'page')];
    const next = [makeNode('banana', 'page'), makeNode('apple', 'page')];
    expect(hasTreeChanged(old, next)).toBe(true);
  });

  it('returns true when originalName changes but fullPath stays the same', () => {
    const old = [{ ...makeNode('a/b', 'page'), originalName: 'a /b' }];
    const next = [{ ...makeNode('a/b', 'page'), originalName: 'a/b' }];
    expect(hasTreeChanged(old, next)).toBe(true);
  });

  it('returns false when originalName is the same', () => {
    const old = [{ ...makeNode('a/b', 'page'), originalName: 'a /b' }];
    const same = [{ ...makeNode('a/b', 'page'), originalName: 'a /b' }];
    expect(hasTreeChanged(old, same)).toBe(false);
  });
});
