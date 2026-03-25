import '../styles/index.css';
import { useTree } from '../hooks/useTree';
import { TreeView } from './TreeView';

export function App() {
  const { tree, toggle, navigate } = useTree();

  const handleClose = () => {
    logseq.hideMainUI();
  };

  return (
    <div class="tree-panel">
      <button class="tree-panel-close" onClick={handleClose} title="Close">
        ✕
      </button>
      <TreeView tree={tree} onToggle={toggle} onNavigate={navigate} />
    </div>
  );
}
