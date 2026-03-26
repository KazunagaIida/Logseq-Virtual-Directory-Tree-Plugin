import '@logseq/libs';
import { render } from 'preact';
import { App } from './components/App';

const TOOLBAR_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;

function main() {
  logseq.provideModel({
    togglePanel() {
      logseq.toggleMainUI();
    },
  });

  logseq.App.registerUIItem('toolbar', {
    key: 'virtual-directory-tree',
    template: `<a class="button" data-on-click="togglePanel" title="Virtual Directory Tree">${TOOLBAR_ICON}</a>`,
  });

  const container = document.getElementById('app');
  if (container) {
    render(<App />, container);
  }
}

logseq.ready(main).catch(console.error);
