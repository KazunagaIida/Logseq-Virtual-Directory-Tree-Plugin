import type { RenameEntry, RenameResult } from '../utils/rename';
import type { TreeNode } from '../types';

interface ConfirmDialogProps {
  sourceNode: TreeNode;
  sourceNodes?: TreeNode[];
  targetPath: string;
  renameList: RenameEntry[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  sourceNode,
  sourceNodes,
  targetPath,
  renameList,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const sources = sourceNodes && sourceNodes.length > 1 ? sourceNodes : [sourceNode];
  const isMulti = sources.length > 1;
  const isFolder = sourceNode.type === 'folder' || sourceNode.type === 'both';
  const targetDisplay = targetPath === '' ? '/ (root)' : targetPath + '/';

  const title = isMulti
    ? `Move ${sources.length} items?`
    : isFolder
      ? 'Move folder?'
      : 'Move page?';

  return (
    <div class="dialog-overlay" data-testid="confirm-dialog">
      <div class="dialog-box">
        <div class="dialog-title">{title}</div>
        <div class="dialog-body">
          {isMulti ? (
            <div class="dialog-field">
              <strong>Items:</strong>{' '}
              {sources.map((s) => s.displayName).join(', ')}
            </div>
          ) : (
            <div class="dialog-field">
              <strong>From:</strong> {sourceNode.fullPath}
              {isFolder ? '/' : ''}
            </div>
          )}
          <div class="dialog-field">
            <strong>To:</strong> {targetDisplay}
          </div>
          <div class="dialog-field">
            <strong>Affected pages:</strong> {renameList.length}
          </div>
          {renameList.length > 0 && (
            <div class="dialog-rename-list">
              {renameList.slice(0, 5).map((entry) => (
                <div key={entry.oldName} class="dialog-rename-item">
                  {entry.oldName} → {entry.newName}
                </div>
              ))}
              {renameList.length > 5 && (
                <div class="dialog-rename-more">
                  ... ({renameList.length - 5} more)
                </div>
              )}
            </div>
          )}
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn dialog-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button class="dialog-btn dialog-btn-confirm" onClick={onConfirm}>
            Move
          </button>
        </div>
      </div>
    </div>
  );
}

interface LoadingDialogProps {}

export function LoadingDialog(_props: LoadingDialogProps) {
  return (
    <div class="dialog-overlay" data-testid="loading-dialog">
      <div class="dialog-box">
        <div class="dialog-title">Moving pages...</div>
        <div class="dialog-body">
          <div class="dialog-loading">Please wait...</div>
        </div>
      </div>
    </div>
  );
}

interface ResultDialogProps {
  result: RenameResult;
  onClose: () => void;
}

export function ResultDialog({ result, onClose }: ResultDialogProps) {
  return (
    <div class="dialog-overlay" data-testid="result-dialog">
      <div class="dialog-box">
        <div class="dialog-title">Some pages failed to move</div>
        <div class="dialog-body">
          <div class="dialog-rename-list">
            {result.succeeded.map((entry) => (
              <div key={entry.oldName} class="dialog-rename-item dialog-success">
                ✅ {entry.oldName} → {entry.newName}
              </div>
            ))}
            {result.failed.map((entry) => (
              <div key={entry.oldName} class="dialog-rename-item dialog-failure">
                <div>❌ {entry.oldName} → {entry.newName}</div>
                <div class="dialog-error-detail">→ {entry.error}</div>
              </div>
            ))}
          </div>
          <div class="dialog-reindex-hint">
            If pages look incorrect, please re-index manually:
            Settings → Advanced → Re-index
          </div>
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn dialog-btn-confirm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
