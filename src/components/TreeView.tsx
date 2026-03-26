import type { TreeNode } from '../types';
import { TreeNodeComponent } from './TreeNode';

interface TreeViewProps {
  tree: TreeNode[];
  activeNode?: string | null;
  onToggle: (fullPath: string) => void;
  onNavigate: (fullPath: string) => void;
  onReveal?: () => void;
  onClose?: () => void;
  onDragStart?: (node: TreeNode, e: DragEvent) => void;
  onDragOver?: (targetFullPath: string, e: DragEvent) => void;
  onDragLeave?: () => void;
  onDragEnd?: () => void;
  onDrop?: (targetFullPath: string, e: DragEvent) => void;
  dropTarget?: string | null;
}

const REVEAL_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>`;

export function TreeView({
  tree,
  activeNode,
  onToggle,
  onNavigate,
  onReveal,
  onClose,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
  dropTarget,
}: TreeViewProps) {
  const handleRootDragOver = (e: DragEvent) => {
    e.preventDefault();
    onDragOver?.('__root__', e);
  };

  const handleRootDrop = (e: DragEvent) => {
    e.preventDefault();
    onDrop?.('__root__', e);
  };

  const isRootDropTarget = dropTarget === '__root__';

  return (
    <>
      <div class="tree-panel-header">
        <span class="tree-panel-title">Virtual Directory</span>
        {onReveal && (
          <button
            class="tree-panel-btn"
            onClick={onReveal}
            title="Reveal current page"
            data-testid="reveal-btn"
          >
            <span dangerouslySetInnerHTML={{ __html: REVEAL_ICON }} />
          </button>
        )}
        {onClose && (
          <button class="tree-panel-btn" onClick={onClose} title="Close">
            ✕
          </button>
        )}
      </div>
      <div
        class={`tree-container${isRootDropTarget ? ' tree-root-drop-target' : ''}`}
        onDragOver={handleRootDragOver}
        onDragLeave={onDragLeave}
        onDrop={handleRootDrop}
      >
        {tree.length === 0 ? (
          <div class="tree-warning">No pages found.</div>
        ) : (
          tree.map((node) => (
            <TreeNodeComponent
              key={node.fullPath}
              node={node}
              depth={0}
              activeNode={activeNode}
              onToggle={onToggle}
              onNavigate={onNavigate}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDragEnd={onDragEnd}
              onDrop={onDrop}
              dropTarget={dropTarget}
            />
          ))
        )}
      </div>
    </>
  );
}
