import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildRenameList, executeRenames } from '../utils/rename';
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
