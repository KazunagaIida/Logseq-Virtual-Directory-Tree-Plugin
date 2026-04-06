/** Logseq CSS variable → plugin CSS variable mapping */
export const COLOR_MAP: ReadonlyArray<{ lsVar: string; vdtVar: string }> = [
  { lsVar: '--ls-primary-background-color', vdtVar: '--vdt-bg' },
  { lsVar: '--ls-secondary-background-color', vdtVar: '--vdt-bg-secondary' },
  { lsVar: '--ls-primary-text-color', vdtVar: '--vdt-text' },
  { lsVar: '--ls-secondary-text-color', vdtVar: '--vdt-text-secondary' },
  { lsVar: '--ls-border-color', vdtVar: '--vdt-border' },
  { lsVar: '--ls-icon-color', vdtVar: '--vdt-icon' },
  { lsVar: '--ls-link-text-color', vdtVar: '--vdt-link' },
  { lsVar: '--ls-link-text-color', vdtVar: '--vdt-accent' },
  { lsVar: '--ls-scrollbar-foreground-color', vdtVar: '--vdt-scrollbar' },
];

/** Sentinel color used to detect unresolved CSS variables */
export const SENTINEL = 'rgb(1, 2, 3)';

/**
 * Read a single Logseq CSS variable by injecting `var(--ls-xxx)` on a probe
 * element and reading the resolved computed color. Returns `null` when the
 * variable is not defined (resolves to the sentinel).
 */
function readCssVar(
  probe: HTMLElement,
  lsVar: string,
  getComputed: typeof getComputedStyle,
): string | null {
  probe.style.color = `var(${lsVar}, ${SENTINEL})`;
  const resolved = getComputed(probe).color;
  return resolved && resolved !== SENTINEL ? resolved : null;
}

/**
 * Try to read Logseq CSS variables from a target window's document via a
 * temporary probe element. Returns the number of variables successfully applied.
 */
export function probeAndApply(
  targetDoc: Document,
  localRoot: HTMLElement,
  getComputed: typeof getComputedStyle = getComputedStyle,
): number {
  const probe = targetDoc.createElement('div');
  probe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;pointer-events:none;';
  targetDoc.body.appendChild(probe);

  try {
    let applied = 0;
    for (const { lsVar, vdtVar } of COLOR_MAP) {
      const value = readCssVar(probe, lsVar, getComputed);
      if (value) {
        localRoot.style.setProperty(vdtVar, value);
        applied++;
      }
    }
    return applied;
  } finally {
    probe.remove();
  }
}

/**
 * Fallback: read computed body styles directly and apply bg/text.
 */
export function applyBodyFallback(
  targetDoc: Document,
  localRoot: HTMLElement,
  getComputed: typeof getComputedStyle = getComputedStyle,
): boolean {
  const bodyStyles = getComputed(targetDoc.body);
  const bg = bodyStyles.backgroundColor;
  const text = bodyStyles.color;
  if (!bg && !text) return false;
  if (bg) localRoot.style.setProperty('--vdt-bg', bg);
  if (text) localRoot.style.setProperty('--vdt-text', text);
  return true;
}

/**
 * Clear all inline color overrides so CSS defaults apply.
 */
export function clearOverrides(localRoot: HTMLElement): void {
  for (const { vdtVar } of COLOR_MAP) {
    localRoot.style.removeProperty(vdtVar);
  }
}

/**
 * Read Logseq CSS variables via a temporary probe element in the parent
 * document. Direct getPropertyValue() returns empty from the iframe, but
 * setting `var(--ls-xxx)` on an actual element and reading computed style works.
 *
 * Falls back to body computed styles, then clears overrides if all access fails.
 */
export function syncLogseqColors(): void {
  const targets = [top, parent];
  const localRoot = document.documentElement;

  for (const target of targets) {
    try {
      if (probeAndApply(target!.document, localRoot) > 0) return;
    } catch {
      /* sandboxed — try next target */
    }
  }

  for (const target of targets) {
    try {
      if (applyBodyFallback(target!.document, localRoot)) return;
    } catch {
      /* sandboxed */
    }
  }

  clearOverrides(localRoot);
}
