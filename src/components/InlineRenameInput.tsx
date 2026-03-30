import { useState, useRef, useEffect } from 'preact/hooks';
import { validatePageName } from '../utils/validation';

interface InlineRenameInputProps {
  currentName: string; // leaf name (e.g. "hooks")
  onConfirm: (newLeafName: string) => void;
  onCancel: () => void;
}

export function InlineRenameInput({ currentName, onConfirm, onCancel }: InlineRenameInputProps) {
  const [value, setValue] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.focus();
      input.select();
    }
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === currentName) {
      onCancel();
      return;
    }
    const error = validatePageName(trimmed);
    if (error) {
      onCancel();
      return;
    }
    onConfirm(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      class="inline-rename-input"
      type="text"
      value={value}
      onInput={(e) => setValue((e.target as HTMLInputElement).value)}
      onKeyDown={handleKeyDown}
      onBlur={handleSubmit}
      onClick={(e: Event) => e.stopPropagation()}
      data-testid="inline-rename-input"
    />
  );
}
