import type { TreeNode, SortConfig } from '../types';
import { TreeNodeComponent } from './TreeNode';
import { SortMenu } from './SortMenu';

interface TreeViewProps {
  tree: TreeNode[];
  activeNode?: string | null;
  onToggle: (fullPath: string) => void;
  onNavigate: (fullPath: string) => void;
  onReveal?: () => void;
  onClose?: () => void;
  onCreatePage?: () => void;
  sortConfig?: SortConfig;
  onSortChange?: (config: SortConfig) => void;
  showSortMenu?: boolean;
  onToggleSortMenu?: () => void;
  onCloseSortMenu?: () => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  onSelect?: (fullPath: string, ctrlKey: boolean, shiftKey: boolean) => void;
  isNodeSelected?: (fullPath: string) => boolean;
  renamingPath?: string | null;
  onContextMenu?: (node: TreeNode, x: number, y: number) => void;
  onRenameConfirm?: (node: TreeNode, newLeafName: string) => void;
  onRenameCancel?: () => void;
  onDragStart?: (node: TreeNode, e: DragEvent) => void;
  onDragOver?: (targetFullPath: string, e: DragEvent) => void;
  onDragLeave?: () => void;
  onDragEnd?: () => void;
  onDrop?: (targetFullPath: string, e: DragEvent) => void;
  dropTarget?: string | null;
}

const ICON_SORT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="14" y2="6"/><line x1="4" y1="12" x2="11" y2="12"/><line x1="4" y1="18" x2="8" y2="18"/><polyline points="16 14 19 17 22 14"/><line x1="19" y1="7" x2="19" y2="17"/></svg>`;
const ICON_REVEAL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>`;
const ICON_CREATE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
const ICON_EXPAND = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 8 12 13 17 8"/><polyline points="7 14 12 19 17 14"/></svg>`;
const ICON_COLLAPSE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 16 12 11 17 16"/><polyline points="7 10 12 5 17 10"/></svg>`;

export function TreeView({
  tree,
  activeNode,
  onToggle,
  onNavigate,
  onReveal,
  onClose,
  onCreatePage,
  onExpandAll,
  onCollapseAll,
  onSelect,
  isNodeSelected,
  sortConfig,
  onSortChange,
  showSortMenu,
  onToggleSortMenu,
  onCloseSortMenu,
  renamingPath,
  onContextMenu,
  onRenameConfirm,
  onRenameCancel,
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
        {onCreatePage && (
          <button class="tree-panel-btn" onClick={onCreatePage} title="Create new page" data-testid="create-btn">
            <span dangerouslySetInnerHTML={{ __html: ICON_CREATE }} />
          </button>
        )}
        {onToggleSortMenu && (
          <button class="tree-panel-btn" onClick={onToggleSortMenu} title="Sort" data-testid="sort-btn">
            <span dangerouslySetInnerHTML={{ __html: ICON_SORT }} />
          </button>
        )}
        {onExpandAll && (
          <button class="tree-panel-btn" onClick={onExpandAll} title="Expand all" data-testid="expand-all-btn">
            <span dangerouslySetInnerHTML={{ __html: ICON_EXPAND }} />
          </button>
        )}
        {onCollapseAll && (
          <button class="tree-panel-btn" onClick={onCollapseAll} title="Collapse all" data-testid="collapse-all-btn">
            <span dangerouslySetInnerHTML={{ __html: ICON_COLLAPSE }} />
          </button>
        )}
        {onReveal && (
          <button class="tree-panel-btn" onClick={onReveal} title="Reveal current page" data-testid="reveal-btn">
            <span dangerouslySetInnerHTML={{ __html: ICON_REVEAL }} />
          </button>
        )}
        {onClose && (
          <button class="tree-panel-btn" onClick={onClose} title="Close">
            ✕
          </button>
        )}
      </div>
      {showSortMenu && sortConfig && onSortChange && onCloseSortMenu && (
        <SortMenu
          config={sortConfig}
          onChange={onSortChange}
          onClose={onCloseSortMenu}
        />
      )}
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
              isSelected={isNodeSelected?.(node.fullPath)}
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
          ))
        )}
      </div>
    </>
  );
}
