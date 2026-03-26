import '@logseq/libs';
import { render } from 'preact';
import { App } from './components/App';

let setVisibleCallback: ((visible: boolean) => void) | null = null;

export function onVisibleChange(cb: (visible: boolean) => void) {
  setVisibleCallback = cb;
}

function main() {
  console.log('Virtual Directory Tree plugin loaded');

  // Style the main UI iframe as a right-side floating panel
  logseq.setMainUIInlineStyle({
    position: 'fixed',
    top: '0',
    right: '0',
    bottom: '0',
    width: '280px',
    zIndex: '999',
  });

  // Register toolbar icon button
  logseq.App.registerUIItem('toolbar', {
    key: 'virtual-directory-tree',
    template: `<a class="button" data-on-click="togglePanel" title="Virtual Directory Tree">📁</a>`,
  });

  // Model for UI event handlers
  logseq.provideModel({
    togglePanel() {
      logseq.toggleMainUI();
    },
  });

  // Notify App component when panel visibility changes
  logseq.on('ui:visible:changed', ({ visible }: { visible: boolean }) => {
    setVisibleCallback?.(visible);
  });

  // Mount Preact app
  const container = document.getElementById('app');
  if (container) {
    render(<App />, container);
  }
}

logseq.ready(main).catch(console.error);
