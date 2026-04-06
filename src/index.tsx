import '@logseq/libs';
import { render } from 'preact';
import { App } from './components/App';
import { adjustMainContent, resetMainContent, getToolbarHeight } from './utils/panelLayout';
import { syncLogseqColors } from './utils/themeSync';

const TOOLBAR_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;

function detectTheme(): 'dark' | 'light' {
  // Method 1: Read data-theme from parent/top document
  try {
    const topTheme = top?.document?.documentElement?.getAttribute('data-theme');
    if (topTheme === 'dark' || topTheme === 'light') return topTheme;
  } catch {
    /* sandboxed */
  }

  try {
    const parentTheme = parent?.document?.documentElement?.getAttribute('data-theme');
    if (parentTheme === 'dark' || parentTheme === 'light') return parentTheme;
  } catch {
    /* sandboxed */
  }

  // Method 2: Check parent body background color
  try {
    const bg = getComputedStyle(top!.document.body).backgroundColor;
    if (bg) {
      const match = bg.match(/\d+/g);
      if (match) {
        const [r, g, b] = match.map(Number);
        if (r + g + b < 380) return 'dark';
        return 'light';
      }
    }
  } catch {
    /* sandboxed */
  }

  return 'dark';
}

function applyTheme(theme: 'dark' | 'light') {
  document.documentElement.setAttribute('data-theme', theme);
  syncLogseqColors().catch(() => {
    /* best-effort — CSS defaults remain */
  });
}

function main() {
  logseq.useSettingsSchema([
    {
      key: 'hiddenPages',
      type: 'string',
      default: 'card, Favorites, Contents',
      title: 'Hidden Pages',
      description:
        'Comma-separated root-level names to hide from the tree. A name hides the page itself and all pages under it (e.g., "card" hides "card", "card/deck1", "card/deck1/sub", etc.). Matching is case-insensitive ("contents" = "Contents"). Only root-level names are supported — nested paths like "dev/react" will not work.',
    },
  ]);

  logseq.provideModel({
    togglePanel() {
      logseq.toggleMainUI();
    },
  });

  logseq.App.registerUIItem('toolbar', {
    key: 'virtual-directory-tree',
    template: `<a class="button" data-on-click="togglePanel" title="Virtual Directory Tree">${TOOLBAR_ICON}</a>`,
  });

  // Apply theme
  applyTheme(detectTheme());

  logseq.App.onThemeModeChanged(() => {
    applyTheme(detectTheme());
  });

  logseq.on('ui:visible:changed', ({ visible }: { visible: boolean }) => {
    if (visible) {
      applyTheme(detectTheme());
      adjustMainContent(280);
      const toolbarH = getToolbarHeight();
      document.documentElement.style.setProperty('--vdt-toolbar-height', `${toolbarH}px`);
      // Shrink iframe to panel area only so clicks pass through to Logseq
      logseq.setMainUIInlineStyle({
        position: 'fixed',
        top: `${toolbarH}px`,
        right: '0',
        left: 'auto',
        width: '280px',
        height: `calc(100vh - ${toolbarH}px)`,
        zIndex: '999',
      });
    } else {
      resetMainContent();
    }
  });

  const container = document.getElementById('app');
  if (container) {
    render(<App />, container);
  }
}

logseq.ready(main).catch(console.error);
