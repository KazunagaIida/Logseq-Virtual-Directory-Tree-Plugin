import type { RenameEntry, RenameResult } from '../utils/rename';
import type { TreeNode } from '../types';

// Group rename entries by destination folder
function groupByDestination(entries: RenameEntry[]): Map<string, { leaf: string; from: string }[]> {
  const groups = new Map<string, { leaf: string; from: string }[]>();
  for (const entry of entries) {
    const newParts = entry.newName.split('/');
    const destFolder = newParts.length > 1 ? newParts.slice(0, -1).join('/') + '/' : '/ (root)';
    const leaf = newParts[newParts.length - 1];
    const oldParts = entry.oldName.split('/');
    const fromFolder = oldParts.length > 1 ? oldParts.slice(0, -1).join('/') + '/' : '/ (root)';

    if (!groups.has(destFolder)) groups.set(destFolder, []);
    groups.get(destFolder)!.push({ leaf, from: fromFolder });
  }
  return groups;
}

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

  const grouped = groupByDestination(renameList);
  const MAX_ITEMS = 8;
  let shown = 0;
  const remaining = renameList.length - MAX_ITEMS;

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
              {Array.from(grouped.entries()).map(([dest, items]) => {
                if (shown >= MAX_ITEMS) return null;
                return (
                  <div key={dest} class="dialog-rename-group">
                    <div class="dialog-rename-dest">{dest}</div>
                    {items.map((item) => {
                      if (shown >= MAX_ITEMS) return null;
                      shown++;
                      return (
                        <div key={item.leaf + item.from} class="dialog-rename-item">
                          {item.leaf} <span class="dialog-rename-from">from {item.from}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {remaining > 0 && (
                <div class="dialog-rename-more">
                  ... ({remaining} more)
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
