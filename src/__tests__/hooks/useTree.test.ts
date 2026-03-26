import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { useTree } from '../../hooks/useTree';
import type { PageEntity } from '../../types';

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
      await vi.runAllTimersAsync();
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
      await vi.runAllTimersAsync();
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
      await vi.runAllTimersAsync();
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
      await vi.runAllTimersAsync();
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
      await vi.runAllTimersAsync();
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
      await vi.runAllTimersAsync();
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
