import type { SortConfig, SortKey, SortDirection } from '../types';

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

  const setSort = (key: SortKey, direction: SortDirection) => {
    onChange({ ...config, key, direction });
    onClose();
  };

  const toggleFoldersFirst = () => {
    onChange({ ...config, foldersFirst: !config.foldersFirst });
    onClose();
  };

  const isActive = (key: SortKey, direction: SortDirection) =>
    config.key === key && config.direction === direction;

  return (
    <div class="sort-menu-overlay" onClick={handleOverlayClick} data-testid="sort-menu-overlay">
      <div
        class="sort-menu"
        onClick={(e: Event) => e.stopPropagation()}
        data-testid="sort-menu"
      >
        <button
          class={`sort-menu-item${isActive('name', 'asc') ? ' sort-menu-item-active' : ''}`}
          onClick={() => setSort('name', 'asc')}
          data-testid="sort-name-asc"
        >
          {isActive('name', 'asc') ? '\u2713 ' : '\u2003 '}{'Name (A \u2192 Z)'}
        </button>
        <button
          class={`sort-menu-item${isActive('name', 'desc') ? ' sort-menu-item-active' : ''}`}
          onClick={() => setSort('name', 'desc')}
          data-testid="sort-name-desc"
        >
          {isActive('name', 'desc') ? '\u2713 ' : '\u2003 '}{'Name (Z \u2192 A)'}
        </button>
        <div class="sort-menu-separator" />
        <button
          class={`sort-menu-item${isActive('updatedAt', 'desc') ? ' sort-menu-item-active' : ''}`}
          onClick={() => setSort('updatedAt', 'desc')}
          data-testid="sort-updated-desc"
        >
          {isActive('updatedAt', 'desc') ? '\u2713 ' : '\u2003 '}Updated (Newest)
        </button>
        <button
          class={`sort-menu-item${isActive('updatedAt', 'asc') ? ' sort-menu-item-active' : ''}`}
          onClick={() => setSort('updatedAt', 'asc')}
          data-testid="sort-updated-asc"
        >
          {isActive('updatedAt', 'asc') ? '\u2713 ' : '\u2003 '}Updated (Oldest)
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
