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

/**
 * Sync plugin colors with Logseq's theme using the official SDK API.
 * resolveThemeCssPropsVals() runs getComputedStyle on the host side
 * and returns values via IPC, so it works cross-origin.
 *
 * If the API is unavailable or fails, CSS defaults from index.css apply.
 */
export async function syncLogseqColors(): Promise<void> {
  if (!logseq.UI?.resolveThemeCssPropsVals) return;

  const lsVars = [...new Set(COLOR_MAP.map((m) => m.lsVar))];
  const resolved = await logseq.UI.resolveThemeCssPropsVals(lsVars);
  if (!resolved) return;

  const localRoot = document.documentElement;
  for (const { lsVar, vdtVar } of COLOR_MAP) {
    const value = resolved[lsVar]?.trim();
    if (value) {
      localRoot.style.setProperty(vdtVar, value);
    }
  }
}
