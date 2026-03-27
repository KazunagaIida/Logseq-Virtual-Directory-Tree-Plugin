import type { SortConfig } from '../types';

interface SortMenuProps {
  config: SortConfig;
  onChange: (config: SortConfig) => void;
  onClose: () => void;
}

export function SortMenu({ config, onChange, onClose }: SortMenuProps) {
  const handleOverlayClick = (e: Event) => {
    e.stopPropagation();
    onClose();
  };

  const setDirection = (direction: 'asc' | 'desc') => {
    onChange({ ...config, direction });
    onClose();
  };

  const toggleFoldersFirst = () => {
    onChange({ ...config, foldersFirst: !config.foldersFirst });
    onClose();
  };

  return (
    <div class="sort-menu-overlay" onClick={handleOverlayClick} data-testid="sort-menu-overlay">
      <div
        class="sort-menu"
        onClick={(e: Event) => e.stopPropagation()}
        data-testid="sort-menu"
      >
        <button
          class={`sort-menu-item${config.direction === 'asc' ? ' sort-menu-item-active' : ''}`}
          onClick={() => setDirection('asc')}
          data-testid="sort-asc"
        >
          {config.direction === 'asc' ? '\u2713 ' : '\u2003 '}{'Name (A \u2192 Z)'}
        </button>
        <button
          class={`sort-menu-item${config.direction === 'desc' ? ' sort-menu-item-active' : ''}`}
          onClick={() => setDirection('desc')}
          data-testid="sort-desc"
        >
          {config.direction === 'desc' ? '\u2713 ' : '\u2003 '}{'Name (Z \u2192 A)'}
        </button>
        <div class="sort-menu-separator" />
        <button
          class="sort-menu-item"
          onClick={toggleFoldersFirst}
          data-testid="sort-folders-first"
        >
          {config.foldersFirst ? '\u2713 ' : '\u2003 '}Folders first
        </button>
      </div>
    </div>
  );
}
