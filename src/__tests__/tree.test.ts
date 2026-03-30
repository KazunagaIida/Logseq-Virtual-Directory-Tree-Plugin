import { describe, it, expect } from 'vitest';
import { buildTree, sortTree, propagateUpdatedAt } from '../tree';
import type { PageEntity, SortConfig, TreeNode } from '../types';

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

  it('trims spaces around namespace separators', () => {
    const tree = buildTree([
      makePage('dev / react / hooks'),
      makePage('dev /typescript'),
    ]);

    expect(tree).toHaveLength(1);
    const dev = tree[0];
    expect(dev.name).toBe('dev');
    expect(dev.fullPath).toBe('dev');
    expect(dev.children).toHaveLength(2);

    const react = dev.children[0];
    expect(react.name).toBe('react');
    expect(react.fullPath).toBe('dev/react');
    expect(react.children[0].name).toBe('hooks');
    expect(react.children[0].fullPath).toBe('dev/react/hooks');

    const ts = dev.children[1];
    expect(ts.name).toBe('typescript');
    expect(ts.fullPath).toBe('dev/typescript');
  });

  it('sets originalName on leaf page nodes', () => {
    const tree = buildTree([makePage('dev/react/hooks')]);
    const hooks = tree[0].children[0].children[0];
    expect(hooks.originalName).toBe('dev/react/hooks');
  });

  it('does not set originalName on intermediate folder nodes', () => {
    const tree = buildTree([makePage('dev/react/hooks')]);
    expect(tree[0].originalName).toBeUndefined(); // dev = folder
    expect(tree[0].children[0].originalName).toBeUndefined(); // react = folder
  });

  it('sets originalName on both-type nodes', () => {
    const tree = buildTree([
      makePage('dev/react'),
      makePage('dev/react/hooks'),
    ]);
    const react = tree[0].children[0];
    expect(react.type).toBe('both');
    expect(react.originalName).toBe('dev/react');
  });

  it('preserves original page name with spaces in originalName', () => {
    const tree = buildTree([
      makePage('人気雑誌 /smartpass/viewer fix'),
    ]);
    // fullPath is trimmed (for internal use)
    const viewer = tree[0].children[0].children[0];
    expect(viewer.fullPath).toBe('人気雑誌/smartpass/viewer fix');
    // originalName preserves the original page name with spaces around /
    expect(viewer.originalName).toBe('人気雑誌 /smartpass/viewer fix');
  });

  it('preserves spaces in originalName while trimming fullPath', () => {
    const tree = buildTree([
      makePage('a /b / c'),
    ]);
    const leaf = tree[0].children[0].children[0];
    expect(leaf.name).toBe('c');
    expect(leaf.fullPath).toBe('a/b/c');
    expect(leaf.originalName).toBe('a /b / c');
  });
});

function makeNode(
  name: string,
  type: TreeNode['type'] = 'page',
  children: TreeNode[] = [],
  updatedAt?: number
): TreeNode {
  return {
    name,
    displayName: name,
    fullPath: name,
    type,
    children,
    isExpanded: false,
    updatedAt,
  };
}

describe('sortTree with SortConfig', () => {
  it('sorts descending when direction is desc', () => {
    const nodes: TreeNode[] = [makeNode('apple'), makeNode('cherry'), makeNode('banana')];
    sortTree(nodes, { key: 'name', direction: 'desc', foldersFirst: false });
    expect(nodes.map((n) => n.name)).toEqual(['cherry', 'banana', 'apple']);
  });

  it('sorts ascending when direction is asc', () => {
    const nodes: TreeNode[] = [makeNode('cherry'), makeNode('apple'), makeNode('banana')];
    sortTree(nodes, { key: 'name', direction: 'asc', foldersFirst: false });
    expect(nodes.map((n) => n.name)).toEqual(['apple', 'banana', 'cherry']);
  });

  it('does not group folders first when foldersFirst is false', () => {
    const nodes: TreeNode[] = [
      makeNode('zebra'),
      makeNode('dev', 'folder', [makeNode('dev/react')]),
      makeNode('apple'),
    ];
    sortTree(nodes, { key: 'name', direction: 'asc', foldersFirst: false });
    expect(nodes.map((n) => n.name)).toEqual(['apple', 'dev', 'zebra']);
  });

  it('groups folders first when foldersFirst is true', () => {
    const nodes: TreeNode[] = [
      makeNode('zebra'),
      makeNode('dev', 'folder', [makeNode('dev/react')]),
      makeNode('apple'),
    ];
    sortTree(nodes, { key: 'name', direction: 'asc', foldersFirst: true });
    expect(nodes.map((n) => n.name)).toEqual(['dev', 'apple', 'zebra']);
  });

  it('sorts folders first + descending', () => {
    const nodes: TreeNode[] = [
      makeNode('apple'),
      makeNode('cooking', 'folder', [makeNode('cooking/sous-vide')]),
      makeNode('dev', 'folder', [makeNode('dev/react')]),
      makeNode('banana'),
    ];
    sortTree(nodes, { key: 'name', direction: 'desc', foldersFirst: true });
    // Folders first (desc: dev, cooking), then pages (desc: banana, apple)
    expect(nodes.map((n) => n.name)).toEqual(['dev', 'cooking', 'banana', 'apple']);
  });

  it('uses default config (asc + foldersFirst) when no config provided', () => {
    const nodes: TreeNode[] = [
      makeNode('zebra'),
      makeNode('dev', 'folder', [makeNode('dev/react')]),
      makeNode('apple'),
    ];
    sortTree(nodes);
    expect(nodes.map((n) => n.name)).toEqual(['dev', 'apple', 'zebra']);
  });

  it('sorts recursively in children', () => {
    const nodes: TreeNode[] = [
      makeNode('dev', 'folder', [
        makeNode('typescript'),
        makeNode('react'),
        makeNode('angular'),
      ]),
    ];
    sortTree(nodes, { key: 'name', direction: 'desc', foldersFirst: false });
    expect(nodes[0].children.map((n) => n.name)).toEqual(['typescript', 'react', 'angular']);
  });

  it('buildTree accepts sortConfig parameter', () => {
    const tree = buildTree(
      [makePage('zebra'), makePage('dev/react'), makePage('apple')],
      { key: 'name', direction: 'desc', foldersFirst: false }
    );
    expect(tree.map((n) => n.name)).toEqual(['zebra', 'dev', 'apple']);
  });
});

describe('propagateUpdatedAt', () => {
  it('keeps page node updatedAt as-is', () => {
    const nodes: TreeNode[] = [
      makeNode('memo', 'page', [], 1000),
    ];
    propagateUpdatedAt(nodes);
    expect(nodes[0].updatedAt).toBe(1000);
  });

  it('sets folder updatedAt to max of children', () => {
    const nodes: TreeNode[] = [
      makeNode('dev', 'folder', [
        makeNode('hooks', 'page', [], 1000),
        makeNode('state', 'page', [], 3000),
        makeNode('utils', 'page', [], 2000),
      ]),
    ];
    propagateUpdatedAt(nodes);
    expect(nodes[0].updatedAt).toBe(3000);
  });

  it('propagates through deep nesting', () => {
    const nodes: TreeNode[] = [
      makeNode('a', 'folder', [
        makeNode('b', 'folder', [
          makeNode('c', 'folder', [
            makeNode('leaf', 'page', [], 5000),
          ]),
        ]),
      ]),
    ];
    propagateUpdatedAt(nodes);
    expect(nodes[0].updatedAt).toBe(5000);
    expect(nodes[0].children[0].updatedAt).toBe(5000);
    expect(nodes[0].children[0].children[0].updatedAt).toBe(5000);
  });

  it('treats undefined updatedAt as 0', () => {
    const nodes: TreeNode[] = [
      makeNode('dev', 'folder', [
        makeNode('hooks', 'page', []),
        makeNode('state', 'page', [], 2000),
      ]),
    ];
    propagateUpdatedAt(nodes);
    expect(nodes[0].updatedAt).toBe(2000);
  });

  it('uses max of own and children for type both', () => {
    const nodes: TreeNode[] = [
      makeNode('dev', 'both', [
        makeNode('hooks', 'page', [], 1000),
      ], 5000),
    ];
    propagateUpdatedAt(nodes);
    expect(nodes[0].updatedAt).toBe(5000);

    // When child is newer
    const nodes2: TreeNode[] = [
      makeNode('dev', 'both', [
        makeNode('hooks', 'page', [], 9000),
      ], 2000),
    ];
    propagateUpdatedAt(nodes2);
    expect(nodes2[0].updatedAt).toBe(9000);
  });

  it('leaves folder updatedAt as undefined when all children lack it', () => {
    const nodes: TreeNode[] = [
      makeNode('dev', 'folder', [
        makeNode('hooks', 'page', []),
        makeNode('state', 'page', []),
      ]),
    ];
    propagateUpdatedAt(nodes);
    expect(nodes[0].updatedAt).toBeUndefined();
  });
});

describe('sortTree with updatedAt', () => {
  it('sorts by updatedAt descending (newest first)', () => {
    const nodes: TreeNode[] = [
      makeNode('old', 'page', [], 1000),
      makeNode('new', 'page', [], 3000),
      makeNode('mid', 'page', [], 2000),
    ];
    sortTree(nodes, { key: 'updatedAt', direction: 'desc', foldersFirst: false });
    expect(nodes.map((n) => n.name)).toEqual(['new', 'mid', 'old']);
  });

  it('sorts by updatedAt ascending (oldest first)', () => {
    const nodes: TreeNode[] = [
      makeNode('old', 'page', [], 1000),
      makeNode('new', 'page', [], 3000),
      makeNode('mid', 'page', [], 2000),
    ];
    sortTree(nodes, { key: 'updatedAt', direction: 'asc', foldersFirst: false });
    expect(nodes.map((n) => n.name)).toEqual(['old', 'mid', 'new']);
  });

  it('foldersFirst works with updatedAt sort', () => {
    const nodes: TreeNode[] = [
      makeNode('page-new', 'page', [], 5000),
      makeNode('folder-old', 'folder', [makeNode('child')], 1000),
      makeNode('page-old', 'page', [], 1000),
      makeNode('folder-new', 'folder', [makeNode('child2')], 3000),
    ];
    sortTree(nodes, { key: 'updatedAt', direction: 'desc', foldersFirst: true });
    // Folders first (desc by updatedAt), then pages (desc by updatedAt)
    expect(nodes.map((n) => n.name)).toEqual(['folder-new', 'folder-old', 'page-new', 'page-old']);
  });

  it('treats undefined updatedAt as 0 in sorting', () => {
    const nodes: TreeNode[] = [
      makeNode('no-date', 'page', []),
      makeNode('has-date', 'page', [], 1000),
    ];
    sortTree(nodes, { key: 'updatedAt', direction: 'desc', foldersFirst: false });
    expect(nodes.map((n) => n.name)).toEqual(['has-date', 'no-date']);
  });

  it('sorts recursively within children by updatedAt', () => {
    const nodes: TreeNode[] = [
      makeNode('dev', 'folder', [
        makeNode('old-child', 'page', [], 1000),
        makeNode('new-child', 'page', [], 3000),
      ]),
    ];
    sortTree(nodes, { key: 'updatedAt', direction: 'desc', foldersFirst: false });
    expect(nodes[0].children.map((n) => n.name)).toEqual(['new-child', 'old-child']);
  });
});

describe('buildTree with updatedAt', () => {
  it('copies updatedAt from PageEntity to TreeNode', () => {
    const tree = buildTree([
      makePage('memo', { updatedAt: 5000 }),
    ]);
    expect(tree[0].updatedAt).toBe(5000);
  });

  it('propagates updatedAt to folder nodes', () => {
    const tree = buildTree([
      makePage('dev/hooks', { updatedAt: 1000 }),
      makePage('dev/state', { updatedAt: 3000 }),
    ]);
    const dev = tree[0];
    expect(dev.updatedAt).toBe(3000);
  });

  it('sets updatedAt on both-type nodes from page data', () => {
    const tree = buildTree([
      makePage('dev/react', { updatedAt: 2000 }),
      makePage('dev/react/hooks', { updatedAt: 5000 }),
    ]);
    const react = tree[0].children[0];
    expect(react.type).toBe('both');
    expect(react.updatedAt).toBe(5000); // max of own (2000) and child (5000)
  });

  it('sorts by updatedAt when sortConfig specifies it', () => {
    const tree = buildTree(
      [
        makePage('old-page', { updatedAt: 1000 }),
        makePage('new-page', { updatedAt: 3000 }),
      ],
      { key: 'updatedAt', direction: 'desc', foldersFirst: false }
    );
    expect(tree.map((n) => n.name)).toEqual(['new-page', 'old-page']);
  });
});
