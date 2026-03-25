import type { TreeNode as TreeNodeType } from '../types';

interface TreeNodeProps {
  node: TreeNodeType;
  depth: number;
  onToggle: (fullPath: string) => void;
  onNavigate: (fullPath: string) => void;
}

const INDENT_PX = 16;

export function TreeNodeComponent({
  node,
  depth,
  onToggle,
  onNavigate,
}: TreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const isFolder = node.type === 'folder' || node.type === 'both';

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
      // folder-only: clicking anywhere toggles
      onToggle(node.fullPath);
    }
  };

  const handleRowClick = () => {
    if (node.type === 'folder') {
      onToggle(node.fullPath);
    } else if (node.type === 'page') {
      onNavigate(node.fullPath);
    }
    // 'both': handled by icon/label click handlers separately
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

  return (
    <div>
      <div
        class="tree-node"
        style={{ paddingLeft: `${depth * INDENT_PX}px` }}
        onClick={handleRowClick}
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
