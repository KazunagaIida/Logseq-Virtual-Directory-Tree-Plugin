import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import { TreeNodeComponent } from '../../components/TreeNode';
import type { TreeNode } from '../../types';

function makeNode(
  overrides: Partial<TreeNode> & { fullPath: string }
): TreeNode {
  const parts = overrides.fullPath.split('/');
  return {
    name: parts[parts.length - 1],
    displayName: parts[parts.length - 1],
    type: 'page',
    children: [],
    isExpanded: false,
    ...overrides,
  };
}

describe('TreeNodeComponent', () => {
  const onToggle = vi.fn();
  const onNavigate = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders a page node with text and no expand icon', () => {
    const node = makeNode({ fullPath: 'memo', type: 'page' });
    const { getByTestId } = render(
      <TreeNodeComponent node={node} depth={0} onToggle={onToggle} onNavigate={onNavigate} />
    );

    const label = getByTestId('node-label');
    expect(label.textContent).toBe('memo');

    // Page nodes show a bullet, not ▼/▶
    const icon = getByTestId('tree-node-memo').querySelector('.tree-node-icon');
    expect(icon?.textContent).toBe('•');
  });

  it('renders a closed folder with ▶ and hides children', () => {
    const child = makeNode({ fullPath: 'dev/hooks', type: 'page' });
    const node = makeNode({
      fullPath: 'dev',
      type: 'folder',
      children: [child],
      isExpanded: false,
    });

    const { getByTestId, queryByTestId } = render(
      <TreeNodeComponent node={node} depth={0} onToggle={onToggle} onNavigate={onNavigate} />
    );

    const icon = getByTestId('node-icon');
    expect(icon.textContent).toBe('▶');
    expect(queryByTestId('tree-node-dev/hooks')).toBeNull();
  });

  it('renders an open folder with ▼ and shows children', () => {
    const child = makeNode({ fullPath: 'dev/hooks', type: 'page' });
    const node = makeNode({
      fullPath: 'dev',
      type: 'folder',
      children: [child],
      isExpanded: true,
    });

    const { getByTestId } = render(
      <TreeNodeComponent node={node} depth={0} onToggle={onToggle} onNavigate={onNavigate} />
    );

    const icon = getByTestId('node-icon');
    expect(icon.textContent).toBe('▼');
    expect(getByTestId('tree-node-dev/hooks')).toBeTruthy();
  });

  it('renders a "both" node with expand icon and text', () => {
    const child = makeNode({ fullPath: 'dev/react/hooks', type: 'page' });
    const node = makeNode({
      fullPath: 'dev/react',
      displayName: 'react',
      type: 'both',
      children: [child],
      isExpanded: true,
    });

    const { getByTestId } = render(
      <TreeNodeComponent node={node} depth={1} onToggle={onToggle} onNavigate={onNavigate} />
    );

    const row = getByTestId('tree-node-dev/react');
    expect(row.querySelector('[data-testid="node-icon"]')!.textContent).toBe('▼');
    expect(row.querySelector('[data-testid="node-label"]')!.textContent).toBe('react');
  });

  it('"both" node: icon click calls onToggle', () => {
    const child = makeNode({ fullPath: 'dev/react/hooks', type: 'page' });
    const node = makeNode({
      fullPath: 'dev/react',
      type: 'both',
      children: [child],
      isExpanded: true,
    });

    const { getByTestId } = render(
      <TreeNodeComponent node={node} depth={0} onToggle={onToggle} onNavigate={onNavigate} />
    );

    fireEvent.click(getByTestId('node-icon'));
    expect(onToggle).toHaveBeenCalledWith('dev/react');
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('"both" node: label click calls onNavigate', () => {
    const child = makeNode({ fullPath: 'dev/react/hooks', type: 'page' });
    const node = makeNode({
      fullPath: 'dev/react',
      type: 'both',
      children: [child],
      isExpanded: true,
    });

    const { getByTestId } = render(
      <TreeNodeComponent node={node} depth={0} onToggle={onToggle} onNavigate={onNavigate} />
    );

    const row = getByTestId('tree-node-dev/react');
    fireEvent.click(row.querySelector('[data-testid="node-label"]')!);
    expect(onNavigate).toHaveBeenCalledWith('dev/react');
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('applies correct indentation based on depth', () => {
    const node = makeNode({ fullPath: 'deep/node', type: 'page' });

    const { getByTestId } = render(
      <TreeNodeComponent node={node} depth={3} onToggle={onToggle} onNavigate={onNavigate} />
    );

    const row = getByTestId('tree-node-deep/node');
    expect(row.style.paddingLeft).toBe('48px'); // 3 * 16px
  });
});
