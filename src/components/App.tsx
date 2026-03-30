import '../styles/index.css';
import { useState, useCallback, useEffect, useRef } from 'preact/hooks';
import type { TreeNode } from '../types';
import { useTree } from '../hooks/useTree';
import { useSelection } from '../hooks/useSelection';
import { useDragDrop } from '../hooks/useDragDrop';
import { useContextMenu } from '../hooks/useContextMenu';
import { buildRenameList, executeRenames } from '../utils/rename';
import { resetMainContent, expandIframeForDialog, shrinkIframeToPanel } from '../utils/panelLayout';
import { TreeView } from './TreeView';
import { ConfirmDialog, LoadingDialog, ResultDialog } from './ConfirmDialog';
import { CreatePageDialog } from './CreatePageDialog';
import { ContextMenu } from './ContextMenu';

export function App() {
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<TreeNode | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { menu, openMenu, closeMenu } = useContextMenu();

  const dragActiveRef = useRef(false);

  const [showSortMenu, setShowSortMenu] = useState(false);

  const isBusy = useCallback(() => {
    return (
      renamingPath !== null ||
      deleteConfirm !== null ||
      showCreateDialog ||
      menu.visible ||
      showSortMenu ||
      dragActiveRef.current
    );
  }, [renamingPath, deleteConfirm, showCreateDialog, menu.visible, showSortMenu]);

  const {
    tree,
    activeNode,
    sortConfig,
    toggle,
    navigate,
    reload,
    delayedReload,
    revealPage,
    expandAll,
    collapseAll,
    changeSortConfig,
  } = useTree({ isBusy });
  const { selectedPaths, isSelected, toggleSelect, clearSelection } = useSelection(tree);
  const {
    state,
    onDragStart: onDragStartInner,
    onDragOver,
    onDragLeave,
    onDragEnd: onDragEndInner,
    onDrop,
    confirmMove,
    cancelMove,
    closeResultDialog,
  } = useDragDrop(tree, reload, selectedPaths, clearSelection, delayedReload);

  const onDragStart = useCallback(
    (node: TreeNode, e: DragEvent) => {
      dragActiveRef.current = true;
      onDragStartInner(node, e);
    },
    [onDragStartInner],
  );

  const onDragEnd = useCallback(() => {
    dragActiveRef.current = false;
    onDragEndInner();
  }, [onDragEndInner]);

  const [createPrefix, setCreatePrefix] = useState('');

  const handleToggleSortMenu = useCallback(() => {
    setShowSortMenu((prev) => !prev);
  }, []);

  const handleCloseSortMenu = useCallback(() => {
    setShowSortMenu(false);
  }, []);

  const handleClose = useCallback(() => {
    clearSelection();
    resetMainContent();
    logseq.hideMainUI();
  }, [clearSelection]);

  const handleReveal = useCallback(async () => {
    try {
      const page = await logseq.Editor.getCurrentPage();
      if (page && (page as Record<string, unknown>).originalName) {
        const name = ((page as Record<string, unknown>).originalName as string)
          .split('/')
          .map((p: string) => p.trim())
          .join('/');
        revealPage(name);
      }
    } catch {
      // Page not available
    }
  }, [revealPage]);

  // Create page
  const getSelectedFolderPrefix = useCallback((): string => {
    if (selectedPaths.size === 1) {
      const path = Array.from(selectedPaths)[0];
      const findNode = (nodes: TreeNode[], fp: string): TreeNode | null => {
        for (const n of nodes) {
          if (n.fullPath === fp) return n;
          const found = findNode(n.children, fp);
          if (found) return found;
        }
        return null;
      };
      const node = findNode(tree, path);
      if (node && (node.type === 'folder' || node.type === 'both')) {
        return node.fullPath;
      }
    }
    return '';
  }, [selectedPaths, tree]);

  const handleCreatePage = useCallback(() => {
    setCreatePrefix(getSelectedFolderPrefix());
    setShowCreateDialog(true);
    expandIframeForDialog();
  }, [getSelectedFolderPrefix]);

  const handleCreateConfirm = useCallback(async (fullPageName: string) => {
    setShowCreateDialog(false);
    shrinkIframeToPanel();
    try {
      await logseq.Editor.createPage(fullPageName);
      logseq.App.pushState('page', { name: fullPageName });
    } catch (err) {
      console.error('Failed to create page:', err);
    }
  }, []);

  const handleCreateCancel = useCallback(() => {
    setShowCreateDialog(false);
    shrinkIframeToPanel();
  }, []);

  // Context menu actions
  const handleContextMenu = useCallback(
    (node: TreeNode, x: number, y: number) => {
      openMenu(node, x, y);
    },
    [openMenu],
  );

  const handleCtxRename = useCallback(() => {
    if (menu.node) {
      setRenamingPath(menu.node.fullPath);
    }
    closeMenu();
  }, [menu.node, closeMenu]);

  const handleRenameConfirm = useCallback(
    async (node: TreeNode, newLeafName: string) => {
      setRenamingPath(null);
      const oldPath = node.fullPath;
      const parts = oldPath.split('/');
      parts[parts.length - 1] = newLeafName;
      const newPath = parts.join('/');

      if (oldPath === newPath) return;

      // If node has children, rename all descendants too
      if (node.children.length > 0 || node.type === 'both') {
        // buildRenameList uses fullPath for prefix matching, originalName for API oldName
        const entries = buildRenameList(node, '');
        const renameList = entries.map((entry) => {
          // entry.oldName is originalName; compute newName using trimmed fullPath prefix
          // Find matching fullPath from the node's subtree
          const suffix = entry.newName.slice(node.name.length);
          return { oldName: entry.oldName, newName: newPath + suffix };
        });
        // Also include the node itself if it's a page (using originalName)
        if (node.type === 'page' || node.type === 'both') {
          renameList.unshift({
            oldName: node.originalName ?? node.fullPath,
            newName: newPath,
          });
        }
        // Deduplicate
        const seen = new Set<string>();
        const unique = renameList.filter((e) => {
          if (seen.has(e.oldName)) return false;
          seen.add(e.oldName);
          return true;
        });
        await executeRenames(unique);
      } else {
        try {
          await logseq.Editor.renamePage(node.originalName ?? node.fullPath, newPath);
        } catch (err) {
          console.error('Failed to rename:', err);
        }
      }
      reload();
      delayedReload();
    },
    [reload, delayedReload],
  );

  const handleRenameCancel = useCallback(() => {
    setRenamingPath(null);
  }, []);

  const handleCtxDelete = useCallback(() => {
    if (menu.node) {
      setDeleteConfirm(menu.node);
      expandIframeForDialog();
    }
    closeMenu();
  }, [menu.node, closeMenu]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm) return;
    try {
      await logseq.Editor.deletePage(deleteConfirm.originalName ?? deleteConfirm.fullPath);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
    setDeleteConfirm(null);
    shrinkIframeToPanel();
    reload();
    delayedReload();
  }, [deleteConfirm, reload, delayedReload]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm(null);
    shrinkIframeToPanel();
  }, []);

  const handleCtxCopyPath = useCallback(() => {
    if (menu.node) {
      navigator.clipboard.writeText(menu.node.originalName ?? menu.node.fullPath).catch(() => {});
    }
    closeMenu();
  }, [menu.node, closeMenu]);

  const handleCtxCreateHere = useCallback(() => {
    if (menu.node) {
      setCreatePrefix(menu.node.fullPath);
      setShowCreateDialog(true);
      expandIframeForDialog();
    }
    closeMenu();
  }, [menu.node, closeMenu]);

  // Escape key closes any open dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showSortMenu) {
        handleCloseSortMenu();
      } else if (showCreateDialog) {
        handleCreateCancel();
      } else if (deleteConfirm) {
        handleDeleteCancel();
      } else if (state.confirmDialog.visible) {
        cancelMove();
      } else if (state.resultDialog.visible) {
        closeResultDialog();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    showSortMenu,
    showCreateDialog,
    deleteConfirm,
    state.confirmDialog.visible,
    state.resultDialog.visible,
    handleCloseSortMenu,
    handleCreateCancel,
    handleDeleteCancel,
    cancelMove,
    closeResultDialog,
  ]);

  return (
    <div class="tree-panel">
      <TreeView
        tree={tree}
        activeNode={activeNode}
        onToggle={toggle}
        onNavigate={navigate}
        onReveal={handleReveal}
        onClose={handleClose}
        onCreatePage={handleCreatePage}
        sortConfig={sortConfig}
        onSortChange={changeSortConfig}
        showSortMenu={showSortMenu}
        onToggleSortMenu={handleToggleSortMenu}
        onCloseSortMenu={handleCloseSortMenu}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        onSelect={toggleSelect}
        isNodeSelected={isSelected}
        renamingPath={renamingPath}
        onContextMenu={handleContextMenu}
        onRenameConfirm={handleRenameConfirm}
        onRenameCancel={handleRenameCancel}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDragEnd={onDragEnd}
        onDrop={onDrop}
        dropTarget={state.dropTarget}
      />
      {menu.visible && menu.node && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          node={menu.node}
          onRename={handleCtxRename}
          onDelete={handleCtxDelete}
          onCopyPath={handleCtxCopyPath}
          onCreatePageHere={handleCtxCreateHere}
          onClose={closeMenu}
        />
      )}
      {showCreateDialog && (
        <CreatePageDialog
          folderPrefix={createPrefix}
          onConfirm={handleCreateConfirm}
          onCancel={handleCreateCancel}
        />
      )}
      {deleteConfirm && (
        <div class="dialog-overlay" data-testid="delete-confirm-dialog">
          <div class="dialog-box">
            <div class="dialog-title">Delete page?</div>
            <div class="dialog-body">
              <div class="dialog-field">
                Are you sure you want to delete <strong>{deleteConfirm.fullPath}</strong>?
              </div>
            </div>
            <div class="dialog-actions">
              <button class="dialog-btn dialog-btn-cancel" onClick={handleDeleteCancel}>
                Cancel
              </button>
              <button class="dialog-btn context-menu-item-danger" onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {state.confirmDialog.visible && state.confirmDialog.sourceNode && (
        <ConfirmDialog
          sourceNode={state.confirmDialog.sourceNode}
          sourceNodes={state.confirmDialog.sourceNodes}
          targetPath={state.confirmDialog.targetPath}
          renameList={state.confirmDialog.renameList}
          onConfirm={confirmMove}
          onCancel={cancelMove}
        />
      )}
      {state.isLoading && <LoadingDialog />}
      {state.resultDialog.visible && state.resultDialog.result && (
        <ResultDialog result={state.resultDialog.result} onClose={closeResultDialog} />
      )}
    </div>
  );
}
