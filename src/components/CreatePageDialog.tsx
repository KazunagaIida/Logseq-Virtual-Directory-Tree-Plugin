import { useState, useRef, useEffect } from 'preact/hooks';
import { validatePageName } from '../utils/validation';

interface CreatePageDialogProps {
  folderPrefix: string; // e.g. "dev/react" or "" for root
  onConfirm: (fullPageName: string) => void;
  onCancel: () => void;
}

export function CreatePageDialog({
  folderPrefix,
  onConfirm,
  onCancel,
}: CreatePageDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Page name cannot be empty');
      return;
    }
    const validationError = validatePageName(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }
    const fullName = folderPrefix ? folderPrefix + '/' + trimmed : trimmed;
    onConfirm(fullName);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const prefix = folderPrefix ? folderPrefix + '/' : '';

  return (
    <div class="dialog-overlay" data-testid="create-page-dialog">
      <div class="dialog-box">
        <div class="dialog-title">Create new page</div>
        <div class="dialog-body">
          <div class="dialog-field">
            <span class="dialog-rename-from">{prefix}</span>
            <input
              ref={inputRef}
              type="text"
              class="dialog-input"
              value={name}
              onInput={(e) => {
                setName((e.target as HTMLInputElement).value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Page name"
            />
          </div>
          {error && <div class="dialog-error">{error}</div>}
        </div>
        <div class="dialog-actions">
          <button class="dialog-btn dialog-btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button class="dialog-btn dialog-btn-confirm" onClick={handleSubmit}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
