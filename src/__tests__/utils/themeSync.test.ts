import { describe, it, expect, beforeEach, vi } from 'vitest';
import { syncLogseqColors, COLOR_MAP } from '../../utils/themeSync';

describe('syncLogseqColors', () => {
  beforeEach(() => {
    // Reset inline styles on documentElement
    for (const { vdtVar } of COLOR_MAP) {
      document.documentElement.style.removeProperty(vdtVar);
    }
  });

  it('applies resolved colors from the official API', async () => {
    const mockResolved: Record<string, string> = {
      '--ls-primary-background-color': 'rgb(22, 22, 24)',
      '--ls-primary-text-color': 'rgb(237, 237, 239)',
      '--ls-link-text-color': 'rgb(247, 97, 144)',
      '--ls-secondary-text-color': 'rgb(160, 159, 166)',
      '--ls-border-color': 'rgb(41, 41, 41)',
      '--ls-icon-color': 'rgb(160, 159, 166)',
      '--ls-secondary-background-color': 'rgb(30, 30, 33)',
      '--ls-scrollbar-foreground-color': 'rgba(255, 255, 255, 0.2)',
    };
    (logseq.UI as unknown as Record<string, unknown>).resolveThemeCssPropsVals = vi
      .fn()
      .mockResolvedValue(mockResolved);

    await syncLogseqColors();

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--vdt-bg')).toBe('rgb(22, 22, 24)');
    expect(root.style.getPropertyValue('--vdt-text')).toBe('rgb(237, 237, 239)');
    expect(root.style.getPropertyValue('--vdt-accent')).toBe('rgb(247, 97, 144)');
    expect(root.style.getPropertyValue('--vdt-link')).toBe('rgb(247, 97, 144)');
    expect(root.style.getPropertyValue('--vdt-border')).toBe('rgb(41, 41, 41)');
  });

  it('does nothing when API is unavailable', async () => {
    (logseq.UI as unknown as Record<string, unknown>).resolveThemeCssPropsVals = undefined;

    await syncLogseqColors();

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--vdt-bg')).toBe('');
  });

  it('does nothing when API returns null', async () => {
    (logseq.UI as unknown as Record<string, unknown>).resolveThemeCssPropsVals = vi
      .fn()
      .mockResolvedValue(null);

    await syncLogseqColors();

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--vdt-bg')).toBe('');
  });

  it('skips empty values', async () => {
    (logseq.UI as unknown as Record<string, unknown>).resolveThemeCssPropsVals = vi
      .fn()
      .mockResolvedValue({
        '--ls-primary-background-color': 'rgb(22, 22, 24)',
        '--ls-primary-text-color': '',
        '--ls-link-text-color': '   ',
      });

    await syncLogseqColors();

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--vdt-bg')).toBe('rgb(22, 22, 24)');
    expect(root.style.getPropertyValue('--vdt-text')).toBe('');
    expect(root.style.getPropertyValue('--vdt-accent')).toBe('');
  });
});
