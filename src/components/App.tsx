import '../styles/index.css';
import { useTree } from '../hooks/useTree';
import { useDragDrop } from '../hooks/useDragDrop';
import { TreeView } from './TreeView';
import { ConfirmDialog, LoadingDialog, ResultDialog } from './ConfirmDialog';

export function App() {
  const { tree, toggle, navigate, reload } = useTree();
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

  const handleClose = () => {
    logseq.hideMainUI();
  };

  return (
    <div class="tree-overlay" onClick={handleClose}>
      <div class="tree-panel" onClick={(e: Event) => e.stopPropagation()}>
        <button class="tree-panel-close" onClick={handleClose} title="Close">
          ✕
        </button>
        <TreeView
        tree={tree}
        onToggle={toggle}
        onNavigate={navigate}
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
