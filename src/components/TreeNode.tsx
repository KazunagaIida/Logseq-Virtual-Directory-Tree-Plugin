import { useEffect, useRef } from 'preact/hooks';
import type { TreeNode as TreeNodeType } from '../types';
import { InlineRenameInput } from './InlineRenameInput';

interface TreeNodeProps {
  node: TreeNodeType;
  depth: number;
  activeNode?: string | null;
  isSelected?: boolean;
  renamingPath?: string | null;
  onToggle: (fullPath: string) => void;
  onNavigate: (fullPath: string) => void;
  onSelect?: (fullPath: string, ctrlKey: boolean, shiftKey: boolean) => void;
  onContextMenu?: (node: TreeNodeType, x: number, y: number) => void;
  onRenameConfirm?: (node: TreeNodeType, newLeafName: string) => void;
  onRenameCancel?: () => void;
  onDragStart?: (node: TreeNodeType, e: DragEvent) => void;
  onDragOver?: (targetFullPath: string, e: DragEvent) => void;
  onDragLeave?: () => void;
  onDragEnd?: () => void;
  onDrop?: (targetFullPath: string, e: DragEvent) => void;
  dropTarget?: string | null;
  isNodeSelected?: (fullPath: string) => boolean;
}

const INDENT_PX = 16;

export function TreeNodeComponent({
  node,
  depth,
  activeNode,
  isSelected,
  renamingPath,
  onToggle,
  onNavigate,
  onSelect,
  onContextMenu,
  onRenameConfirm,
  onRenameCancel,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
  dropTarget,
  isNodeSelected,
}: TreeNodeProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const hasChildren = node.children.length > 0;
  const isFolder = node.type === 'folder' || node.type === 'both';
  const isDropTarget = dropTarget === node.fullPath;
  const isActive = activeNode?.toLowerCase() === node.fullPath.toLowerCase();

  useEffect(() => {
    if (isActive && rowRef.current) {
      rowRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [isActive]);

  const handleIconClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      onSelect?.(node.fullPath, e.ctrlKey || e.metaKey, e.shiftKey);
      return;
    }
    onSelect?.(node.fullPath, false, false);
    if (isFolder) {
      onToggle(node.fullPath);
    }
  };

  const handleLabelClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      onSelect?.(node.fullPath, e.ctrlKey || e.metaKey, e.shiftKey);
      return;
    }
    onSelect?.(node.fullPath, false, false);
    if (node.type === 'page' || node.type === 'both') {
      onNavigate(node.originalName ?? node.fullPath);
    } else {
      onToggle(node.fullPath);
    }
  };

  const handleRowClick = (e: MouseEvent) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      onSelect?.(node.fullPath, e.ctrlKey || e.metaKey, e.shiftKey);
      return;
    }
    onSelect?.(node.fullPath, false, false);
    if (node.type === 'folder') {
      onToggle(node.fullPath);
    } else if (node.type === 'page') {
      onNavigate(node.originalName ?? node.fullPath);
    }
  };

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu?.(node, e.clientX, e.clientY);
  };

  const isRenaming = renamingPath === node.fullPath;

  const handleDragStart = (e: DragEvent) => {
    onDragStart?.(node, e);
  };

  const handleDragOver = (e: DragEvent) => {
    if (isFolder) {
      e.stopPropagation();
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

  const rowClass = [
    'tree-node',
    isDropTarget && 'tree-node-drop-target',
    isActive && 'tree-node-active',
    isSelected && 'tree-node-selected',
  ].filter(Boolean).join(' ');

  return (
    <div>
      <div
        ref={rowRef}
        class={rowClass}
        style={{ paddingLeft: `${depth * INDENT_PX}px` }}
        onClick={handleRowClick}
        onContextMenu={handleContextMenu}
        draggable={!isRenaming}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnd={onDragEnd}
        onDrop={handleDrop}
        data-testid={`tree-node-${node.fullPath}`}
      >
        {renderIcon()}
        {isRenaming ? (
          <InlineRenameInput
            currentName={node.displayName}
            onConfirm={(newName) => onRenameConfirm?.(node, newName)}
            onCancel={() => onRenameCancel?.()}
          />
        ) : (
          <span class={labelClass} onClick={handleLabelClick} data-testid="node-label">
            {node.displayName}
          </span>
        )}
      </div>
      {isFolder && node.isExpanded && (
        <div class="tree-node-children">
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              activeNode={activeNode}
              isSelected={isNodeSelected?.(child.fullPath)}
              renamingPath={renamingPath}
              onToggle={onToggle}
              onNavigate={onNavigate}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              onRenameConfirm={onRenameConfirm}
              onRenameCancel={onRenameCancel}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDragEnd={onDragEnd}
              onDrop={onDrop}
              dropTarget={dropTarget}
              isNodeSelected={isNodeSelected}
            />
          ))}
        </div>
      )}
    </div>
  );
}
