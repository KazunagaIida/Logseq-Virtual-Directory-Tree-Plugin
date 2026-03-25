import type { TreeNode as TreeNodeType } from '../types';

interface TreeNodeProps {
  node: TreeNodeType;
  depth: number;
  onToggle: (fullPath: string) => void;
  onNavigate: (fullPath: string) => void;
  onDragStart?: (node: TreeNodeType, e: DragEvent) => void;
  onDragOver?: (targetFullPath: string, e: DragEvent) => void;
  onDragLeave?: () => void;
  onDragEnd?: () => void;
  onDrop?: (targetFullPath: string, e: DragEvent) => void;
  dropTarget?: string | null;
}

const INDENT_PX = 16;

export function TreeNodeComponent({
  node,
  depth,
  onToggle,
  onNavigate,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
  dropTarget,
}: TreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const isFolder = node.type === 'folder' || node.type === 'both';
  const isDropTarget = dropTarget === node.fullPath;

  const handleIconClick = (e: Event) => {
    e.stopPropagation();
    if (isFolder) {
      onToggle(node.fullPath);
    }
  };

  const handleLabelClick = (e: Event) => {
    e.stopPropagation();
    if (node.type === 'page' || node.type === 'both') {
      onNavigate(node.fullPath);
    } else {
      onToggle(node.fullPath);
    }
  };

  const handleRowClick = () => {
    if (node.type === 'folder') {
      onToggle(node.fullPath);
    } else if (node.type === 'page') {
      onNavigate(node.fullPath);
    }
  };

  const handleDragStart = (e: DragEvent) => {
    onDragStart?.(node, e);
  };

  const handleDragOver = (e: DragEvent) => {
    if (isFolder) {
      onDragOver?.(node.fullPath, e);
    }
  };

  const handleDragLeave = () => {
    onDragLeave?.();
  };

  const handleDrop = (e: DragEvent) => {
    if (isFolder) {
      onDrop?.(node.fullPath, e);
    }
  };

  const renderIcon = () => {
    if (!isFolder) {
      return <span class="tree-node-icon">{'•'}</span>;
    }
    return (
      <span class="tree-node-icon" onClick={handleIconClick} data-testid="node-icon">
        {node.isExpanded ? '▼' : '▶'}
      </span>
    );
  };

  const labelClass =
    node.type === 'page' || node.type === 'both'
      ? 'tree-node-label clickable'
      : 'tree-node-label';

  const rowClass = `tree-node${isDropTarget ? ' tree-node-drop-target' : ''}`;

  return (
    <div>
      <div
        class={rowClass}
        style={{ paddingLeft: `${depth * INDENT_PX}px` }}
        onClick={handleRowClick}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnd={onDragEnd}
        onDrop={handleDrop}
        data-testid={`tree-node-${node.fullPath}`}
      >
        {renderIcon()}
        <span class={labelClass} onClick={handleLabelClick} data-testid="node-label">
          {node.displayName}
        </span>
      </div>
      {isFolder && node.isExpanded && (
        <div class="tree-node-children">
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              onToggle={onToggle}
              onNavigate={onNavigate}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDragEnd={onDragEnd}
              onDrop={onDrop}
              dropTarget={dropTarget}
            />
          ))}
        </div>
      )}
    </div>
  );
}
