import { describe, it, expect } from 'vitest';
import { buildTree } from '../tree';
import type { PageEntity } from '../types';

function makePage(
  name: string,
  opts?: Partial<PageEntity>
): PageEntity {
  return {
    id: Math.floor(Math.random() * 10000),
    uuid: crypto.randomUUID(),
    name: name.toLowerCase(),
    originalName: name,
    'journal?': false,
    ...opts,
  };
}

describe('buildTree', () => {
  it('returns empty tree for empty array', () => {
    expect(buildTree([])).toEqual([]);
  });

  it('places a single page without namespace at root', () => {
    const tree = buildTree([makePage('memo')]);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('memo');
    expect(tree[0].type).toBe('page');
    expect(tree[0].children).toHaveLength(0);
    expect(tree[0].fullPath).toBe('memo');
  });

  it('places a single page with namespace in correct hierarchy', () => {
    const tree = buildTree([makePage('dev/react/hooks')]);
    expect(tree).toHaveLength(1);

    const dev = tree[0];
    expect(dev.name).toBe('dev');
    expect(dev.type).toBe('folder');
    expect(dev.fullPath).toBe('dev');

    const react = dev.children[0];
    expect(react.name).toBe('react');
    expect(react.type).toBe('folder');
    expect(react.fullPath).toBe('dev/react');

    const hooks = react.children[0];
    expect(hooks.name).toBe('hooks');
    expect(hooks.type).toBe('page');
    expect(hooks.fullPath).toBe('dev/react/hooks');
  });

  it('groups multiple pages under the same namespace folder', () => {
    const tree = buildTree([
      makePage('dev/react/hooks'),
      makePage('dev/react/state-management'),
    ]);

    expect(tree).toHaveLength(1);
    const react = tree[0].children[0];
    expect(react.children).toHaveLength(2);
    expect(react.children.map((c) => c.name)).toContain('hooks');
    expect(react.children.map((c) => c.name)).toContain('state-management');
  });

  it('excludes journal pages', () => {
    const tree = buildTree([
      makePage('memo'),
      makePage('2024-01-01', { 'journal?': true }),
      makePage('2024-01-02', { 'journal?': true }),
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('memo');
  });

  it('sets type to "both" when a folder also exists as a page', () => {
    const tree = buildTree([
      makePage('dev/react'),
      makePage('dev/react/hooks'),
    ]);

    const dev = tree[0];
    const react = dev.children[0];
    expect(react.type).toBe('both');
    expect(react.fullPath).toBe('dev/react');
    expect(react.children).toHaveLength(1);
    expect(react.children[0].name).toBe('hooks');
  });

  it('handles case-insensitive dedup without creating duplicate nodes', () => {
    const tree = buildTree([
      makePage('Dev/React'),
      makePage('dev/react/hooks'),
    ]);

    // Only one root node for "dev"/"Dev"
    expect(tree).toHaveLength(1);
    const dev = tree[0];
    // Only one child for "react"/"React"
    expect(dev.children).toHaveLength(1);
    const react = dev.children[0];
    expect(react.type).toBe('both');
    expect(react.children).toHaveLength(1);
  });

  it('sorts folders first, then pages, alphabetically', () => {
    const tree = buildTree([
      makePage('zebra'),
      makePage('dev/react/hooks'),
      makePage('apple'),
      makePage('cooking/sous-vide'),
    ]);

    // Folders (cooking, dev) come before pages (apple, zebra)
    expect(tree[0].name).toBe('cooking');
    expect(tree[1].name).toBe('dev');
    expect(tree[2].name).toBe('apple');
    expect(tree[3].name).toBe('zebra');
  });

  it('sorts recursively within nested folders', () => {
    const tree = buildTree([
      makePage('dev/typescript/generics'),
      makePage('dev/react/hooks'),
      makePage('dev/react/state'),
    ]);

    const dev = tree[0];
    // react before typescript alphabetically
    expect(dev.children[0].name).toBe('react');
    expect(dev.children[1].name).toBe('typescript');

    // Within react: hooks before state
    const react = dev.children[0];
    expect(react.children[0].name).toBe('hooks');
    expect(react.children[1].name).toBe('state');
  });

  it('handles deep nesting (5+ levels) correctly', () => {
    const tree = buildTree([
      makePage('a/b/c/d/e/f'),
    ]);

    let node = tree[0];
    const expected = ['a', 'b', 'c', 'd', 'e', 'f'];
    for (let i = 0; i < expected.length; i++) {
      expect(node.name).toBe(expected[i]);
      expect(node.fullPath).toBe(expected.slice(0, i + 1).join('/'));
      if (i < expected.length - 1) {
        expect(node.type).toBe('folder');
        expect(node.children).toHaveLength(1);
        node = node.children[0];
      } else {
        expect(node.type).toBe('page');
        expect(node.children).toHaveLength(0);
      }
    }
  });

  it('preserves originalName casing in displayName', () => {
    const tree = buildTree([
      makePage('Dev/React/Hooks'),
    ]);

    const dev = tree[0];
    expect(dev.displayName).toBe('Dev');
    const react = dev.children[0];
    expect(react.displayName).toBe('React');
    const hooks = react.children[0];
    expect(hooks.displayName).toBe('Hooks');
  });

  it('initializes all nodes with isExpanded = false', () => {
    const tree = buildTree([
      makePage('dev/react/hooks'),
      makePage('memo'),
    ]);

    expect(tree[0].isExpanded).toBe(false);
    expect(tree[0].children[0].isExpanded).toBe(false);
    expect(tree[1].isExpanded).toBe(false);
  });
});
