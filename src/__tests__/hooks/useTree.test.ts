import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { useTree } from '../../hooks/useTree';
import type { PageEntity } from '../../types';
import type { UseTreeOptions } from '../../hooks/useTree';

function makePage(name: string): PageEntity {
  return {
    id: Math.floor(Math.random() * 10000),
    uuid: crypto.randomUUID(),
    name: name.toLowerCase(),
    originalName: name,
    'journal?': false,
  };
}

const testPages: PageEntity[] = [
  makePage('dev/react/hooks'),
  makePage('dev/react/state'),
  makePage('dev/typescript'),
  makePage('cooking/sous-vide'),
  makePage('memo'),
];

describe('useTree - revealPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    (logseq.Editor.getAllPages as ReturnType<typeof vi.fn>).mockResolvedValue(
      testPages
    );
    logseq.settings = {};
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('expands parent folders when revealing a nested page', async () => {
    const { result } = renderHook(() => useTree());

    // Wait for initial loadTree
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // All folders should start collapsed
    const devBefore = result.current.tree.find((n) => n.name === 'dev');
    expect(devBefore?.isExpanded).toBe(false);

    // Reveal dev/react/hooks
    act(() => {
      result.current.revealPage('dev/react/hooks');
    });

    const dev = result.current.tree.find((n) => n.name === 'dev');
    expect(dev?.isExpanded).toBe(true);
    const react = dev?.children.find((n) => n.name === 'react');
    expect(react?.isExpanded).toBe(true);

    // activeNode should be set
    expect(result.current.activeNode).toBe('dev/react/hooks');
  });

  it('clears activeNode after 2 seconds', async () => {
    const { result } = renderHook(() => useTree());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    act(() => {
      result.current.revealPage('dev/react/hooks');
    });

    expect(result.current.activeNode).toBe('dev/react/hooks');

    // Advance past the 2s timeout
    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(result.current.activeNode).toBeNull();
  });

  it('does nothing for a nonexistent path', async () => {
    const { result } = renderHook(() => useTree());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    const treeBefore = result.current.tree;

    act(() => {
      result.current.revealPage('nonexistent/path');
    });

    // Tree unchanged, no activeNode
    expect(result.current.tree).toBe(treeBefore);
    expect(result.current.activeNode).toBeNull();
  });

  it('works for root-level pages', async () => {
    const { result } = renderHook(() => useTree());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    act(() => {
      result.current.revealPage('memo');
    });

    // No folders to expand, but activeNode should be set
    expect(result.current.activeNode).toBe('memo');
  });
});

describe('useTree - expandAll / collapseAll', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    (logseq.Editor.getAllPages as ReturnType<typeof vi.fn>).mockResolvedValue(
      testPages
    );
    logseq.settings = {};
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('expandAll expands all folder nodes', async () => {
    const { result } = renderHook(() => useTree());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // All should start collapsed
    const devBefore = result.current.tree.find((n) => n.name === 'dev');
    expect(devBefore?.isExpanded).toBe(false);

    act(() => {
      result.current.expandAll();
    });

    const dev = result.current.tree.find((n) => n.name === 'dev');
    expect(dev?.isExpanded).toBe(true);
    const react = dev?.children.find((n) => n.name === 'react');
    expect(react?.isExpanded).toBe(true);
    const cooking = result.current.tree.find((n) => n.name === 'cooking');
    expect(cooking?.isExpanded).toBe(true);
  });

  it('collapseAll collapses all folder nodes', async () => {
    const { result } = renderHook(() => useTree());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // First expand all
    act(() => {
      result.current.expandAll();
    });

    // Then collapse all
    act(() => {
      result.current.collapseAll();
    });

    const dev = result.current.tree.find((n) => n.name === 'dev');
    expect(dev?.isExpanded).toBe(false);
    const cooking = result.current.tree.find((n) => n.name === 'cooking');
    expect(cooking?.isExpanded).toBe(false);
  });
});

describe('useTree - smart reload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    (logseq.Editor.getAllPages as ReturnType<typeof vi.fn>).mockResolvedValue(
      testPages
    );
    logseq.settings = {};
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('skips setTree when tree content has not changed', async () => {
    const { result } = renderHook(() => useTree());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    const treeBefore = result.current.tree;
    expect(treeBefore.length).toBeGreaterThan(0);

    // Reload with same data
    await act(async () => {
      await result.current.reload();
      await vi.advanceTimersByTimeAsync(100);
    });

    // Tree reference should be the same (setTree was skipped)
    expect(result.current.tree).toBe(treeBefore);
  });

  it('updates tree when content changes', async () => {
    const { result } = renderHook(() => useTree());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    const treeBefore = result.current.tree;

    // Change the data
    const newPages = [...testPages, makePage('new-page')];
    (logseq.Editor.getAllPages as ReturnType<typeof vi.fn>).mockResolvedValue(
      newPages
    );

    await act(async () => {
      await result.current.reload();
      await vi.advanceTimersByTimeAsync(100);
    });

    // Tree reference should be different (setTree was called)
    expect(result.current.tree).not.toBe(treeBefore);
    const newNode = result.current.tree.find((n) => n.name === 'new-page');
    expect(newNode).toBeDefined();
  });

  it('does not load when visible is false', async () => {
    const { result } = renderHook(() => useTree({ visible: false }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    // Tree should remain empty since visible=false prevents initial load
    expect(result.current.tree).toEqual([]);
    expect(logseq.Editor.getAllPages).not.toHaveBeenCalled();
  });

  it('polls while visible and stops when not', async () => {
    const props = { visible: true };
    const { result, rerender } = renderHook(
      (p: UseTreeOptions) => useTree(p),
      { initialProps: props }
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    const callCount = (logseq.Editor.getAllPages as ReturnType<typeof vi.fn>).mock.calls.length;

    // Advance 5 seconds to trigger one poll
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    const callCountAfterPoll = (logseq.Editor.getAllPages as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(callCountAfterPoll).toBeGreaterThan(callCount);

    // Switch to not visible
    rerender({ visible: false });

    const callCountBeforeHidden = (logseq.Editor.getAllPages as ReturnType<typeof vi.fn>).mock.calls.length;

    // Advance 10 seconds - no polling should happen
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    const callCountAfterHidden = (logseq.Editor.getAllPages as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(callCountAfterHidden).toBe(callCountBeforeHidden);
  });

  it('skips reload when isBusy returns true', async () => {
    let busy = false;
    const isBusy = () => busy;

    const { result } = renderHook(() => useTree({ isBusy }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    const treeBefore = result.current.tree;
    expect(treeBefore.length).toBeGreaterThan(0);

    // Set busy, change data, and try to reload
    busy = true;
    const newPages = [...testPages, makePage('new-page')];
    (logseq.Editor.getAllPages as ReturnType<typeof vi.fn>).mockResolvedValue(
      newPages
    );

    await act(async () => {
      await result.current.reload();
      await vi.advanceTimersByTimeAsync(100);
    });

    // Tree should not have changed since isBusy is true
    expect(result.current.tree).toBe(treeBefore);
  });
});
