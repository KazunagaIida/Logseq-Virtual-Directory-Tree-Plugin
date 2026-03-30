export interface TreeNode {
  // Node name (leaf part only, e.g. "hooks")
  name: string;

  // Display name (preserves original casing from Logseq)
  displayName: string;

  // Full path (entire namespace, e.g. "dev/react/hooks")
  fullPath: string;

  // 'folder' = intermediate namespace without its own page
  // 'page' = leaf page with no children
  // 'both' = exists as both folder and page
  type: 'folder' | 'page' | 'both';

  // Child nodes
  children: TreeNode[];

  // Original page name from Logseq (preserves spaces around /)
  // Only set for actual pages (type 'page' or 'both'), not synthesized folders
  originalName?: string;

  // Collapse/expand state
  isExpanded: boolean;

  // Millisecond timestamp (pages: from API, folders: max of descendants)
  updatedAt?: number;
}

export type SortKey = 'name' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: SortKey;
  direction: SortDirection;
  foldersFirst: boolean;
}

export const DEFAULT_SORT_CONFIG: SortConfig = {
  key: 'name',
  direction: 'asc',
  foldersFirst: true,
};

export interface PageEntity {
  id: number;
  uuid: string;
  name: string;
  originalName: string;
  'journal?': boolean;
  [key: string]: unknown;
}
