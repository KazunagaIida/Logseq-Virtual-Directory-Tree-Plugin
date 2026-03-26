import '../styles/index.css';
import { useCallback } from 'preact/hooks';
import { useTree } from '../hooks/useTree';
import { useDragDrop } from '../hooks/useDragDrop';
import { TreeView } from './TreeView';
import { ConfirmDialog, LoadingDialog, ResultDialog } from './ConfirmDialog';

export function App() {
  const { tree, activeNode, toggle, navigate, reload, revealPage } = useTree();
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
  } = useDragDrop(tree, reload);

  const handleClose = useCallback(() => {
    logseq.hideMainUI();
  }, []);

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
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDragEnd={onDragEnd}
          onDrop={onDrop}
          dropTarget={state.dropTarget}
        />
        {state.confirmDialog.visible && state.confirmDialog.sourceNode && (
          <ConfirmDialog
            sourceNode={state.confirmDialog.sourceNode}
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
