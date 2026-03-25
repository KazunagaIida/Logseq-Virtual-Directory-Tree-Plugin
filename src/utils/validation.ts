// Check for invalid characters in a page name.
// Returns an error message string, or null if valid.
export function validatePageName(name: string): string | null {
  if (/[#?\[\]{}|\\^]/.test(name)) {
    return 'Page name contains invalid characters';
  }
  return null;
}

// Detect circular drop: source being dropped into its own descendant.
// Both paths are slash-separated namespace strings.
export function checkCircularDrop(source: string, target: string): boolean {
  const sourceLower = source.toLowerCase();
  const targetLower = target.toLowerCase();

  // Dropping onto itself
  if (sourceLower === targetLower) return true;

  // Dropping into a descendant (target starts with source/)
  if (targetLower.startsWith(sourceLower + '/')) return true;

  return false;
}

// Build the new full path when moving sourcePath into targetFolderPath.
// Takes the leaf name from source and appends it to the target folder.
export function buildNewPath(
  sourcePath: string,
  targetFolderPath: string
): string {
  const parts = sourcePath.split('/');
  const leafName = parts[parts.length - 1];
  return targetFolderPath + '/' + leafName;
}

// Build the new path when dropping to root (namespace removal).
// Returns only the leaf name.
export function buildNewPathForRoot(sourcePath: string): string {
  const parts = sourcePath.split('/');
  return parts[parts.length - 1];
}
