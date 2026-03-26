import { useState, useCallback, useEffect } from 'preact/hooks';
import type { TreeNode } from '../types';

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  node: TreeNode | null;
}

export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    node: null,
  });

  const openMenu = useCallback((node: TreeNode, x: number, y: number) => {
    setMenu({ visible: true, x, y, node });
  }, []);

  const closeMenu = useCallback(() => {
    setMenu((prev) => ({ ...prev, visible: false, node: null }));
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!menu.visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menu.visible, closeMenu]);

  return { menu, openMenu, closeMenu };
}
