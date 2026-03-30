import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildTree } from '../tree';
import { buildRenameList, executeRenames } from '../utils/rename';
import {
  validatePageName,
  checkCircularDrop,
  buildNewPath,
  buildNewPathForRoot,
} from '../utils/validation';
import type { PageEntity, TreeNode } from '../types';

function makePage(name: string, opts?: Partial<PageEntity>): PageEntity {
  return {
    id: Math.floor(Math.random() * 10000),
    uuid: crypto.randomUUID(),
    name: name.toLowerCase(),
    originalName: name,
    'journal?': false,
    ...opts,
  };
}

// Helper to find a node by fullPath in the tree (recursive)
function findNode(nodes: TreeNode[], fullPath: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.fullPath.toLowerCase() === fullPath.toLowerCase()) return node;
    const found = findNode(node.children, fullPath);
    if (found) return found;
  }
  return undefined;
}

describe('Integration: tree build -> node lookup -> path generation -> validation', () => {
  it('builds tree, finds node, generates move path, and validates', () => {
    const pages = [
      makePage('dev/react/hooks'),
      makePage('dev/react/state'),
      makePage('dev/typescript'),
      makePage('cooking/sous-vide'),
      makePage('cooking/grilling'),
    ];
    const tree = buildTree(pages);

    // Find the hooks node
    const hooksNode = findNode(tree, 'dev/react/hooks');
    expect(hooksNode).toBeDefined();
    expect(hooksNode!.type).toBe('page');

    // Generate new path: move hooks to cooking
    const newPath = buildNewPath(hooksNode!.fullPath, 'cooking');
    expect(newPath).toBe('cooking/hooks');

    // Validate the new name
    expect(validatePageName(newPath)).toBeNull();

    // Verify no circular drop
    expect(checkCircularDrop(hooksNode!.fullPath, 'cooking')).toBe(false);
  });

  it('detects circular drop when moving folder into its own child', () => {
    const pages = [
      makePage('dev/react/hooks'),
      makePage('dev/react/state'),
    ];
    const tree = buildTree(pages);

    const devNode = findNode(tree, 'dev');
    expect(devNode).toBeDefined();
    expect(devNode!.type).toBe('folder');

    // Trying to drop dev into dev/react -> circular
    expect(checkCircularDrop(devNode!.fullPath, 'dev/react')).toBe(true);
  });

  it('generates root path when dropping to root', () => {
    const pages = [makePage('dev/react/hooks')];
    const tree = buildTree(pages);

    const hooksNode = findNode(tree, 'dev/react/hooks');
    expect(hooksNode).toBeDefined();

    const rootPath = buildNewPathForRoot(hooksNode!.fullPath);
    expect(rootPath).toBe('hooks');
    expect(validatePageName(rootPath)).toBeNull();
  });

  it('rejects invalid characters in generated path', () => {
    // Simulate a scenario where validation catches bad names
    const badName = 'dev/react[beta]';
    expect(validatePageName(badName)).not.toBeNull();
  });
});

describe('Integration: buildTree -> buildRenameList -> executeRenames', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    (logseq.Editor.getPage as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (logseq.Editor.renamePage as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined
    );
  });

  it('moves a folder with all children successfully', async () => {
    const pages = [
      makePage('dev/react'),
      makePage('dev/react/hooks'),
      makePage('dev/react/state'),
      makePage('cooking/sous-vide'),
    ];
    const tree = buildTree(pages);

    const reactNode = findNode(tree, 'dev/react');
    expect(reactNode).toBeDefined();
    expect(reactNode!.type).toBe('both');
    expect(checkCircularDrop(reactNode!.fullPath, 'cooking')).toBe(false);

    const renameList = buildRenameList(reactNode!, 'cooking');
    expect(renameList).toHaveLength(3);

    const result = await executeRenames(renameList);
    expect(result.succeeded).toHaveLength(3);
    expect(result.failed).toHaveLength(0);
    expect(logseq.Editor.renamePage).toHaveBeenCalledTimes(3);
  });

  it('handles partial failure when target name already exists', async () => {
    const pages = [
      makePage('dev/react'),
      makePage('dev/react/hooks'),
      makePage('dev/react/state'),
    ];
    const tree = buildTree(pages);
    const reactNode = findNode(tree, 'dev/react');
    const renameList = buildRenameList(reactNode!, 'archive');

    // Simulate: archive/react/hooks already exists
    (logseq.Editor.getPage as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(null) // archive/react - OK
      .mockResolvedValueOnce({ id: 99, name: 'archive/react/hooks' }) // conflict
      .mockResolvedValueOnce(null); // archive/react/state - OK

    const result = await executeRenames(renameList);
    expect(result.succeeded).toHaveLength(2);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].oldName).toBe('dev/react/hooks');
    expect(result.failed[0].error).toContain('already exists');
  });

  it('moves a page to root (namespace removal)', async () => {
    const pages = [
      makePage('dev/react/hooks'),
      makePage('dev/react/state'),
    ];
    const tree = buildTree(pages);
    const hooksNode = findNode(tree, 'dev/react/hooks');
    expect(hooksNode).toBeDefined();

    const renameList = buildRenameList(hooksNode!, '');
    expect(renameList).toEqual([
      { oldName: 'dev/react/hooks', newName: 'hooks' },
    ]);

    const result = await executeRenames(renameList);
    expect(result.succeeded).toHaveLength(1);
    expect(result.failed).toHaveLength(0);
    expect(logseq.Editor.renamePage).toHaveBeenCalledWith(
      'dev/react/hooks',
      'hooks'
    );
  });

  it('handles renamePage API error gracefully', async () => {
    const pages = [makePage('dev/hooks')];
    const tree = buildTree(pages);
    const hooksNode = findNode(tree, 'dev/hooks');
    const renameList = buildRenameList(hooksNode!, 'cooking');

    (logseq.Editor.renamePage as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Logseq internal error')
    );

    const result = await executeRenames(renameList);
    expect(result.succeeded).toHaveLength(0);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].error).toBe('Logseq internal error');
  });
});

describe('Integration: buildTree -> add pages -> rebuild -> correct update', () => {
  it('rebuilding tree after adding pages produces correct structure', () => {
    // Initial state: 2 pages
    const initialPages = [
      makePage('dev/react/hooks'),
      makePage('cooking/sous-vide'),
    ];
    const tree1 = buildTree(initialPages);
    expect(tree1).toHaveLength(2); // cooking, dev (folders first, alphabetical)
    expect(tree1[0].name).toBe('cooking');
    expect(tree1[1].name).toBe('dev');

    // Add more pages and rebuild
    const updatedPages = [
      ...initialPages,
      makePage('dev/react/state'),
      makePage('dev/typescript'),
      makePage('cooking/grilling'),
    ];
    const tree2 = buildTree(updatedPages);

    // Still 2 root folders
    expect(tree2).toHaveLength(2);

    // cooking now has 2 children
    const cooking = findNode(tree2, 'cooking');
    expect(cooking).toBeDefined();
    expect(cooking!.children).toHaveLength(2);
    expect(cooking!.children.map((c) => c.name).sort()).toEqual([
      'grilling',
      'sous-vide',
    ]);

    // dev/react now has 2 children
    const react = findNode(tree2, 'dev/react');
    expect(react).toBeDefined();
    expect(react!.children).toHaveLength(2);
    expect(react!.children.map((c) => c.name).sort()).toEqual([
      'hooks',
      'state',
    ]);

    // dev now has 2 children (react folder, typescript page)
    const dev = findNode(tree2, 'dev');
    expect(dev).toBeDefined();
    expect(dev!.children).toHaveLength(2);
  });

  it('rebuilding after removing pages produces correct structure', () => {
    const allPages = [
      makePage('dev/react/hooks'),
      makePage('dev/react/state'),
      makePage('dev/typescript'),
    ];
    const tree1 = buildTree(allPages);
    const react1 = findNode(tree1, 'dev/react');
    expect(react1!.children).toHaveLength(2);

    // Remove dev/react/state
    const reducedPages = [
      makePage('dev/react/hooks'),
      makePage('dev/typescript'),
    ];
    const tree2 = buildTree(reducedPages);
    const react2 = findNode(tree2, 'dev/react');
    expect(react2!.children).toHaveLength(1);
    expect(react2!.children[0].name).toBe('hooks');
  });

  it('handles empty graph correctly', () => {
    const tree = buildTree([]);
    expect(tree).toEqual([]);
  });

  it('handles large graph (100+ pages) correctly', () => {
    const pages: PageEntity[] = [];
    for (let i = 0; i < 120; i++) {
      const folder = `folder${Math.floor(i / 10)}`;
      const page = `page${i}`;
      pages.push(makePage(`${folder}/${page}`));
    }
    const tree = buildTree(pages);

    // Should have 12 root folders (folder0..folder11)
    expect(tree).toHaveLength(12);

    // Each folder should have 10 children
    for (const folder of tree) {
      expect(folder.children).toHaveLength(10);
      expect(folder.type).toBe('folder');
    }
  });

  it('handles 1-level namespace pages correctly', () => {
    const pages = [makePage('dev/hooks')];
    const tree = buildTree(pages);

    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('dev');
    expect(tree[0].type).toBe('folder');
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].name).toBe('hooks');
    expect(tree[0].children[0].type).toBe('page');
  });

  it('handles 5+ level deep namespaces correctly', () => {
    const pages = [
      makePage('a/b/c/d/e/f'),
      makePage('a/b/c/d/e/g'),
      makePage('a/b/x'),
    ];
    const tree = buildTree(pages);

    // Verify deep structure
    const eNode = findNode(tree, 'a/b/c/d/e');
    expect(eNode).toBeDefined();
    expect(eNode!.children).toHaveLength(2);
    expect(eNode!.children.map((c) => c.name).sort()).toEqual(['f', 'g']);

    // Verify branching at b
    const bNode = findNode(tree, 'a/b');
    expect(bNode).toBeDefined();
    expect(bNode!.children).toHaveLength(2); // c (folder) and x (page)
  });

  it('buildRenameList uses originalName for pages with spaces around /', async () => {
    const pages = [
      makePage('人気雑誌 /smartpass/viewer fix'),
    ];
    const tree = buildTree(pages);

    // The folder nodes use trimmed fullPath
    const smartpass = findNode(tree, '人気雑誌/smartpass');
    expect(smartpass).toBeDefined();
    expect(smartpass!.type).toBe('folder');

    // The leaf node preserves originalName
    const viewer = findNode(tree, '人気雑誌/smartpass/viewer fix');
    expect(viewer).toBeDefined();
    expect(viewer!.originalName).toBe('人気雑誌 /smartpass/viewer fix');

    // buildRenameList should use originalName as oldName for API calls
    const renameList = buildRenameList(viewer!, 'archive');
    expect(renameList).toHaveLength(1);
    expect(renameList[0].oldName).toBe('人気雑誌 /smartpass/viewer fix');
    expect(renameList[0].newName).toBe('archive/viewer fix');

    const result = await executeRenames(renameList);
    expect(result.succeeded).toHaveLength(1);
    // The API must be called with the original name (with spaces)
    expect(logseq.Editor.renamePage).toHaveBeenCalledWith(
      '人気雑誌 /smartpass/viewer fix',
      'archive/viewer fix'
    );
  });

  it('buildRenameList handles folder containing pages with spaces around /', async () => {
    const pages = [
      makePage('人気雑誌 /smartpass/viewer fix'),
      makePage('人気雑誌 /smartpass/editor fix'),
    ];
    const tree = buildTree(pages);

    const smartpass = findNode(tree, '人気雑誌/smartpass');
    expect(smartpass).toBeDefined();

    const renameList = buildRenameList(smartpass!, 'archive');
    expect(renameList).toHaveLength(2);
    // oldNames should be original names (with spaces)
    const oldNames = renameList.map((e) => e.oldName).sort();
    expect(oldNames).toEqual([
      '人気雑誌 /smartpass/editor fix',
      '人気雑誌 /smartpass/viewer fix',
    ]);
    // newNames should be clean (trimmed)
    const newNames = renameList.map((e) => e.newName).sort();
    expect(newNames).toEqual([
      'archive/smartpass/editor fix',
      'archive/smartpass/viewer fix',
    ]);
  });

  it('pages without spaces have originalName equal to fullPath', () => {
    const pages = [makePage('dev/react/hooks')];
    const tree = buildTree(pages);
    const hooks = findNode(tree, 'dev/react/hooks');
    expect(hooks!.originalName).toBe('dev/react/hooks');
    expect(hooks!.originalName).toBe(hooks!.fullPath);

    // buildRenameList still works the same
    const renameList = buildRenameList(hooks!, 'cooking');
    expect(renameList).toEqual([
      { oldName: 'dev/react/hooks', newName: 'cooking/hooks' },
    ]);
  });

  it('type "both" nodes work correctly with D&D rename list', () => {
    const pages = [
      makePage('dev/react'),
      makePage('dev/react/hooks'),
      makePage('dev/react/state'),
    ];
    const tree = buildTree(pages);
    const reactNode = findNode(tree, 'dev/react');
    expect(reactNode!.type).toBe('both');

    // Moving a 'both' node should include itself and all descendants
    const renameList = buildRenameList(reactNode!, 'archive');
    expect(renameList).toHaveLength(3);
    expect(renameList[0]).toEqual({
      oldName: 'dev/react',
      newName: 'archive/react',
    });
    expect(renameList[1]).toEqual({
      oldName: 'dev/react/hooks',
      newName: 'archive/react/hooks',
    });
    expect(renameList[2]).toEqual({
      oldName: 'dev/react/state',
      newName: 'archive/react/state',
    });
  });
});
