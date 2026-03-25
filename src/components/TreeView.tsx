import type { TreeNode } from '../types';
import { TreeNodeComponent } from './TreeNode';

interface TreeViewProps {
  tree: TreeNode[];
  onToggle: (fullPath: string) => void;
  onNavigate: (fullPath: string) => void;
  onDragStart?: (node: TreeNode, e: DragEvent) => void;
  onDragOver?: (targetFullPath: string, e: DragEvent) => void;
  onDragLeave?: () => void;
  onDragEnd?: () => void;
  onDrop?: (targetFullPath: string, e: DragEvent) => void;
  dropTarget?: string | null;
}

export function TreeView({
  tree,
  onToggle,
  onNavigate,
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
    <div
      class={`tree-container${isRootDropTarget ? ' tree-root-drop-target' : ''}`}
      onDragOver={handleRootDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleRootDrop}
    >
      <div class="tree-header">Virtual Directory</div>
      {tree.length === 0 ? (
        <div class="tree-warning">No pages found.</div>
      ) : (
        tree.map((node) => (
          <TreeNodeComponent
            key={node.fullPath}
            node={node}
            depth={0}
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
  );
}
