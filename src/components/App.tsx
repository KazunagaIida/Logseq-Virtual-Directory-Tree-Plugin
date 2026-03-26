import '../styles/index.css';
import { useState, useCallback } from 'preact/hooks';
import { useTree } from '../hooks/useTree';
import { useSelection } from '../hooks/useSelection';
import { useDragDrop } from '../hooks/useDragDrop';
import { TreeView } from './TreeView';
import { ConfirmDialog, LoadingDialog, ResultDialog } from './ConfirmDialog';
import { CreatePageDialog } from './CreatePageDialog';

export function App() {
  const { tree, activeNode, toggle, navigate, reload, revealPage, expandAll, collapseAll } = useTree();
  const { selectedPaths, isSelected, toggleSelect, clearSelection } = useSelection(tree);
  const {
    state,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDragEnd,
    onDrop,
    confirmMove,
    cancelMove,
    closeResultDialog,
  } = useDragDrop(tree, reload, selectedPaths, clearSelection);

  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleClose = useCallback(() => {
    clearSelection();
    logseq.hideMainUI();
  }, [clearSelection]);

  const handleReveal = useCallback(async () => {
    try {
      const page = await logseq.Editor.getCurrentPage();
      if (page && (page as any).originalName) {
        const name = ((page as any).originalName as string)
          .split('/')
          .map((p: string) => p.trim())
          .join('/');
        revealPage(name);
      }
    } catch {
      // Page not available
    }
  }, [revealPage]);

  // Determine folder prefix for new page creation
  const getCreatePrefix = useCallback((): string => {
    if (selectedPaths.size === 1) {
      const path = Array.from(selectedPaths)[0];
      // Find the node to check if it's a folder
      const findNode = (nodes: typeof tree, fp: string): typeof tree[0] | null => {
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
    setShowCreateDialog(true);
  }, []);

  const handleCreateConfirm = useCallback(async (fullPageName: string) => {
    setShowCreateDialog(false);
    try {
      await logseq.Editor.createPage(fullPageName);
      logseq.App.pushState('page', { name: fullPageName });
    } catch (err) {
      console.error('Failed to create page:', err);
    }
  }, []);

  const handleCreateCancel = useCallback(() => {
    setShowCreateDialog(false);
  }, []);

  return (
    <div class="tree-overlay" onClick={handleClose}>
      <div class="tree-panel" onClick={(e: Event) => e.stopPropagation()}>
        <TreeView
          tree={tree}
          activeNode={activeNode}
          onToggle={toggle}
          onNavigate={navigate}
          onReveal={handleReveal}
          onClose={handleClose}
          onCreatePage={handleCreatePage}
          onExpandAll={expandAll}
          onCollapseAll={collapseAll}
          onSelect={toggleSelect}
          isNodeSelected={isSelected}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDragEnd={onDragEnd}
          onDrop={onDrop}
          dropTarget={state.dropTarget}
        />
        {showCreateDialog && (
          <CreatePageDialog
            folderPrefix={getCreatePrefix()}
            onConfirm={handleCreateConfirm}
            onCancel={handleCreateCancel}
          />
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
          <ResultDialog
            result={state.resultDialog.result}
            onClose={closeResultDialog}
          />
        )}
      </div>
    </div>
  );
}
