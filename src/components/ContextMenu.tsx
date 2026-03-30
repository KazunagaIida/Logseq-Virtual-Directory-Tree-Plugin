import type { TreeNode } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  node: TreeNode;
  onRename: () => void;
  onDelete: () => void;
  onCopyPath: () => void;
  onCreatePageHere: () => void;
  onClose: () => void;
}

export function ContextMenu({
  x,
  y,
  node,
  onRename,
  onDelete,
  onCopyPath,
  onCreatePageHere,
  onClose,
}: ContextMenuProps) {
  const isFolder = node.type === 'folder';
  const isBoth = node.type === 'both';
  const isPage = node.type === 'page';

  const handleOverlayClick = (e: Event) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      class="context-menu-overlay"
      onClick={handleOverlayClick}
      data-testid="context-menu-overlay"
    >
      <div
        class="context-menu"
        style={{ left: `${x}px`, top: `${y}px` }}
        onClick={(e: Event) => e.stopPropagation()}
        data-testid="context-menu"
      >
        {(isPage || isBoth) && (
          <button class="context-menu-item" onClick={onRename} data-testid="ctx-rename">
            Rename
          </button>
        )}
        {(isFolder || isBoth) && (
          <button class="context-menu-item" onClick={onCreatePageHere} data-testid="ctx-create">
            Create page here
          </button>
        )}
        <button class="context-menu-item" onClick={onCopyPath} data-testid="ctx-copy">
          Copy path
        </button>
        {(isPage || isBoth) && (
          <button
            class="context-menu-item context-menu-item-danger"
            onClick={onDelete}
            data-testid="ctx-delete"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
