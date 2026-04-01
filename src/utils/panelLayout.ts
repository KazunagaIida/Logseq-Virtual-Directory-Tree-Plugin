// Candidate selectors for Logseq's toolbar/header.
const TOOLBAR_SELECTORS = ['.cp__header', '#head', 'header'];

// Default toolbar height when DOM detection fails (e.g. sandboxed iframe in release mode).
const DEFAULT_TOOLBAR_HEIGHT = 48;

const STYLE_KEY = 'vdt-main-content-adjust';

function getParentDoc(): Document | null {
  try {
    return top?.document ?? parent?.document ?? null;
  } catch {
    return null;
  }
}

// Detect toolbar height from parent document
export function getToolbarHeight(): number {
  try {
    const doc = getParentDoc();
    if (doc) {
      for (const selector of TOOLBAR_SELECTORS) {
        const el = doc.querySelector<HTMLElement>(selector);
        if (el) return el.getBoundingClientRect().height;
      }
    }
  } catch {
    // cross-origin access blocked in sandboxed iframe
  }
  return DEFAULT_TOOLBAR_HEIGHT;
}

export function adjustMainContent(panelWidth: number): void {
  logseq.provideStyle({
    key: STYLE_KEY,
    style: `
      #main-content-container {
        margin-right: ${panelWidth}px !important;
      }
    `,
  });
}

// Expand iframe to full screen for dialogs, keep panel at 280px via CSS
export function expandIframeForDialog(): void {
  try {
    document.documentElement.setAttribute('data-dialog-mode', 'true');
    logseq.setMainUIInlineStyle({
      position: 'fixed',
      top: '0',
      right: '0',
      bottom: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: '9999',
    });
  } catch {
    // Fail silently
  }
}

export function shrinkIframeToPanel(): void {
  try {
    // Shrink iframe first (while data-dialog-mode keeps panel at 280px)
    const toolbarH = getToolbarHeight();
    logseq.setMainUIInlineStyle({
      position: 'fixed',
      top: `${toolbarH}px`,
      right: '0',
      left: 'auto',
      width: '280px',
      height: `calc(100vh - ${toolbarH}px)`,
      zIndex: '999',
    });
    // Remove dialog mode after iframe has resized
    setTimeout(() => {
      document.documentElement.removeAttribute('data-dialog-mode');
    }, 50);
  } catch {
    // Fail silently
  }
}

export function resetMainContent(): void {
  logseq.provideStyle({ key: STYLE_KEY, style: '/* vdt-reset */' });
}
