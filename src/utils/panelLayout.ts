// Candidate selectors for Logseq's main content container.
const CONTENT_SELECTORS = [
  '#main-content-container',
  '.cp__sidebar-main-content',
  '#left-container',
  '#app-container',
];

// Candidate selectors for Logseq's toolbar/header.
const TOOLBAR_SELECTORS = [
  '.cp__header',
  '#head',
  'header',
];

let activeElement: HTMLElement | null = null;
let originalMarginRight: string = '';

function getParentDoc(): Document | null {
  try {
    return top?.document ?? parent?.document ?? null;
  } catch {
    return null;
  }
}

function findContentContainer(): HTMLElement | null {
  const doc = getParentDoc();
  if (!doc) return null;

  for (const selector of CONTENT_SELECTORS) {
    const el = doc.querySelector<HTMLElement>(selector);
    if (el) return el;
  }
  return null;
}

// Detect toolbar height from parent document
export function getToolbarHeight(): number {
  try {
    const doc = getParentDoc();
    if (!doc) return 0;

    for (const selector of TOOLBAR_SELECTORS) {
      const el = doc.querySelector<HTMLElement>(selector);
      if (el) return el.getBoundingClientRect().height;
    }
  } catch {
    // Fail silently
  }
  return 0;
}

export function adjustMainContent(panelWidth: number): void {
  try {
    const el = findContentContainer();
    if (!el) return;

    if (!activeElement) {
      originalMarginRight = el.style.marginRight;
    }
    activeElement = el;
    el.style.marginRight = `${panelWidth}px`;
  } catch {
    // Fail silently
  }
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
  try {
    if (activeElement) {
      activeElement.style.marginRight = originalMarginRight;
      activeElement = null;
      originalMarginRight = '';
    }
  } catch {
    // Fail silently
  }
}
