import type { TreeNode } from '../types';

function collectSignatures(nodes: TreeNode[], out: string[]): void {
  for (const n of nodes) {
    out.push(n.fullPath + ':' + n.type);
    collectSignatures(n.children, out);
  }
}

export function hasTreeChanged(
  oldTree: TreeNode[],
  newTree: TreeNode[]
): boolean {
  const oldSigs: string[] = [];
  const newSigs: string[] = [];
  collectSignatures(oldTree, oldSigs);
  collectSignatures(newTree, newSigs);
  if (oldSigs.length !== newSigs.length) return true;
  for (let i = 0; i < oldSigs.length; i++) {
    if (oldSigs[i] !== newSigs[i]) return true;
  }
  return false;
}
