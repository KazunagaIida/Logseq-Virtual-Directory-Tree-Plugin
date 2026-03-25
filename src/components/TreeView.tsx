import type { TreeNode } from '../types';
import { TreeNodeComponent } from './TreeNode';

interface TreeViewProps {
  tree: TreeNode[];
  onToggle: (fullPath: string) => void;
  onNavigate: (fullPath: string) => void;
}

export function TreeView({ tree, onToggle, onNavigate }: TreeViewProps) {
  return (
    <div class="tree-container">
      <div class="tree-header">Virtual Directory</div>
      {tree.length === 0 ? (
        <div class="tree-warning">No pages found.</div>
      ) : (
        tree.map((node) => (
          <TreeNodeComponent
            key={node.fullPath}
            node={node}
            depth={0}
            onToggle={onToggle}
            onNavigate={onNavigate}
          />
        ))
      )}
    </div>
  );
}
