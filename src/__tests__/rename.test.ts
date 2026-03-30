import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildRenameList, buildRenameListMulti, executeRenames } from '../utils/rename';
import type { TreeNode } from '../types';

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

describe('buildRenameList', () => {
  it('generates a single rename for a page move', () => {
    const node = makeNode('dev/react/hooks', 'page');
    const list = buildRenameList(node, 'cooking');
    expect(list).toEqual([
      { oldName: 'dev/react/hooks', newName: 'cooking/hooks' },
    ]);
  });

  it('filters out no-op renames when target folder is the same as source parent', () => {
    // Dropping dev/react/hooks onto sibling in dev/react → target folder is dev/react
    const node = makeNode('dev/react/hooks', 'page');
    const list = buildRenameList(node, 'dev/react');
    expect(list).toEqual([]);
  });

  it('filters out no-op renames case-insensitively', () => {
    const node = makeNode('Dev/React/Hooks', 'page');
    node.originalName = 'Dev/React/Hooks';
    const list = buildRenameList(node, 'dev/react');
    expect(list).toEqual([]);
  });

  it('filters out no-op entries in a folder move while keeping real renames', () => {
    // A 'both' node at dev/react moved to dev → dev/react stays the same (no-op),
    // but dev/react/hooks → dev/react/hooks is also no-op. All filtered.
    const node = makeNode('dev/react', 'both', [
      makeNode('dev/react/hooks', 'page'),
    ]);
    const list = buildRenameList(node, 'dev');
    expect(list).toEqual([]);
  });

  it('generates renames for all child pages of a folder', () => {
    const node = makeNode('dev/react', 'folder', [
      makeNode('dev/react/hooks', 'page'),
      makeNode('dev/react/state', 'page'),
      makeNode('dev/react/memo', 'page'),
    ]);
    const list = buildRenameList(node, 'archive');
    expect(list).toEqual([
      { oldName: 'dev/react/hooks', newName: 'archive/react/hooks' },
      { oldName: 'dev/react/state', newName: 'archive/react/state' },
      { oldName: 'dev/react/memo', newName: 'archive/react/memo' },
    ]);
  });

  it('generates renames for nested child folders', () => {
    const node = makeNode('dev', 'folder', [
      makeNode('dev/react', 'both', [
        makeNode('dev/react/hooks', 'page'),
      ]),
      makeNode('dev/ts', 'page'),
    ]);
    const list = buildRenameList(node, 'archive');
    expect(list).toEqual([
      { oldName: 'dev/react', newName: 'archive/dev/react' },
      { oldName: 'dev/react/hooks', newName: 'archive/dev/react/hooks' },
      { oldName: 'dev/ts', newName: 'archive/dev/ts' },
    ]);
  });

  it('generates renames for root drop (namespace removal)', () => {
    const node = makeNode('dev/react', 'both', [
      makeNode('dev/react/hooks', 'page'),
    ]);
    const list = buildRenameList(node, '');
    expect(list).toEqual([
      { oldName: 'dev/react', newName: 'react' },
      { oldName: 'dev/react/hooks', newName: 'react/hooks' },
    ]);
  });
});

describe('buildRenameListMulti', () => {
  it('merges rename lists from 2 nodes', () => {
    const node1 = makeNode('dev/react/hooks', 'page');
    const node2 = makeNode('dev/react/state', 'page');
    const list = buildRenameListMulti([node1, node2], 'cooking');
    expect(list).toEqual([
      { oldName: 'dev/react/hooks', newName: 'cooking/hooks' },
      { oldName: 'dev/react/state', newName: 'cooking/state' },
    ]);
  });

  it('deduplicates pages that appear in multiple sources', () => {
    // Parent node includes child, and child is also a separate source
    const parent = makeNode('dev/react', 'both', [
      makeNode('dev/react/hooks', 'page'),
    ]);
    const child = makeNode('dev/react/hooks', 'page');
    const list = buildRenameListMulti([parent, child], 'archive');
    // dev/react/hooks should appear only once
    expect(list).toEqual([
      { oldName: 'dev/react', newName: 'archive/react' },
      { oldName: 'dev/react/hooks', newName: 'archive/react/hooks' },
    ]);
  });

  it('handles parent-child nodes correctly', () => {
    const parent = makeNode('dev', 'folder', [
      makeNode('dev/react', 'page'),
      makeNode('dev/ts', 'page'),
    ]);
    const sibling = makeNode('cooking/sv', 'page');
    const list = buildRenameListMulti([parent, sibling], 'archive');
    expect(list).toEqual([
      { oldName: 'dev/react', newName: 'archive/dev/react' },
      { oldName: 'dev/ts', newName: 'archive/dev/ts' },
      { oldName: 'cooking/sv', newName: 'archive/sv' },
    ]);
  });
});

describe('executeRenames', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    (logseq.Editor.getPage as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (logseq.Editor.renamePage as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined
    );
  });

  it('returns all entries in succeeded when all succeed', async () => {
    const list = [
      { oldName: 'dev/hooks', newName: 'cooking/hooks' },
      { oldName: 'dev/state', newName: 'cooking/state' },
    ];
    const result = await executeRenames(list);
    expect(result.succeeded).toEqual(list);
    expect(result.failed).toHaveLength(0);
  });

  it('puts entry in failed when target page already exists', async () => {
    (logseq.Editor.getPage as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 1, name: 'cooking/state' }); // exists

    const list = [
      { oldName: 'dev/hooks', newName: 'cooking/hooks' },
      { oldName: 'dev/state', newName: 'cooking/state' },
    ];
    const result = await executeRenames(list);
    expect(result.succeeded).toEqual([list[0]]);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].oldName).toBe('dev/state');
    expect(result.failed[0].error).toContain('already exists');
  });

  it('calls renamePage for each successful rename', async () => {
    const list = [
      { oldName: 'a', newName: 'b' },
      { oldName: 'c', newName: 'd' },
    ];
    await executeRenames(list);
    expect(logseq.Editor.renamePage).toHaveBeenCalledTimes(2);
    expect(logseq.Editor.renamePage).toHaveBeenCalledWith('a', 'b');
    expect(logseq.Editor.renamePage).toHaveBeenCalledWith('c', 'd');
  });

  it('skips descendant renames when parent rename fails (already exists)', async () => {
    // Parent exists → fails; child should be skipped
    (logseq.Editor.getPage as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: 1, name: 'target' }); // parent exists

    const list = [
      { oldName: 'TODOs/2026-02-10', newName: '2026-02-10' },
      { oldName: 'TODOs/2026-02-10/TODO', newName: '2026-02-10/TODO' },
    ];
    const result = await executeRenames(list);
    expect(result.succeeded).toHaveLength(0);
    expect(result.failed).toHaveLength(2);
    expect(result.failed[0].error).toContain('already exists');
    expect(result.failed[1].error).toBe('Skipped because parent rename failed');
    // Child's renamePage should never be called
    expect(logseq.Editor.renamePage).not.toHaveBeenCalled();
  });

  it('skips descendant renames when parent rename throws', async () => {
    (logseq.Editor.renamePage as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('API error'));

    const list = [
      { oldName: 'dev/react', newName: 'archive/react' },
      { oldName: 'dev/react/hooks', newName: 'archive/react/hooks' },
      { oldName: 'dev/react/state', newName: 'archive/react/state' },
    ];
    const result = await executeRenames(list);
    expect(result.succeeded).toHaveLength(0);
    expect(result.failed).toHaveLength(3);
    expect(result.failed[0].error).toBe('API error');
    expect(result.failed[1].error).toBe('Skipped because parent rename failed');
    expect(result.failed[2].error).toBe('Skipped because parent rename failed');
    expect(logseq.Editor.renamePage).toHaveBeenCalledTimes(1);
  });

  it('does not skip unrelated renames when one fails', async () => {
    // First rename fails, but second is unrelated and should proceed
    (logseq.Editor.getPage as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: 1, name: 'cooking' }) // exists
      .mockResolvedValueOnce(null); // does not exist

    const list = [
      { oldName: 'dev/react', newName: 'cooking' },
      { oldName: 'memo', newName: 'archive/memo' },
    ];
    const result = await executeRenames(list);
    expect(result.succeeded).toHaveLength(1);
    expect(result.succeeded[0].oldName).toBe('memo');
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].oldName).toBe('dev/react');
  });

  it('skips deeply nested descendants on failure', async () => {
    (logseq.Editor.getPage as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: 1, name: 'target' }); // parent exists

    const list = [
      { oldName: 'a/b', newName: 'x' },
      { oldName: 'a/b/c', newName: 'x/c' },
      { oldName: 'a/b/c/d', newName: 'x/c/d' },
    ];
    const result = await executeRenames(list);
    expect(result.succeeded).toHaveLength(0);
    expect(result.failed).toHaveLength(3);
    expect(logseq.Editor.renamePage).not.toHaveBeenCalled();
  });

  it('waits between renames (sleep mock verification)', async () => {
    vi.useFakeTimers();
    const list = [
      { oldName: 'a', newName: 'b' },
      { oldName: 'c', newName: 'd' },
    ];

    const promise = executeRenames(list);

    // First rename resolves immediately, then setTimeout(50) is called
    await vi.advanceTimersByTimeAsync(50);
    const result = await promise;

    expect(result.succeeded).toHaveLength(2);
    vi.useRealTimers();
  });
});
