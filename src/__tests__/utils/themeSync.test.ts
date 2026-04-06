import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  probeAndApply,
  applyBodyFallback,
  clearOverrides,
  COLOR_MAP,
  SENTINEL,
} from '../../utils/themeSync';

/** Create a mock HTMLElement with style get/set tracking */
function mockElement(): HTMLElement {
  const styles: Record<string, string> = {};
  return {
    style: {
      cssText: '',
      color: '',
      setProperty: vi.fn((k: string, v: string) => {
        styles[k] = v;
      }),
      removeProperty: vi.fn((k: string) => {
        delete styles[k];
      }),
    },
    remove: vi.fn(),
    _styles: styles,
  } as unknown as HTMLElement & { _styles: Record<string, string> };
}

/** Build a mock document whose probe resolves given CSS vars */
function mockDocument(
  resolvedVars: Record<string, string> = {},
  bodyStyles: { backgroundColor?: string; color?: string } = {},
): Document {
  const probes: HTMLElement[] = [];
  let currentColor = '';

  const doc = {
    createElement: vi.fn(() => {
      const el = mockElement();
      // Track color assignments so getComputedStyle can resolve them
      Object.defineProperty(el.style, 'color', {
        get: () => currentColor,
        set: (v: string) => {
          currentColor = v;
        },
      });
      probes.push(el);
      return el;
    }),
    body: {
      appendChild: vi.fn(),
      backgroundColor: bodyStyles.backgroundColor ?? '',
      color: bodyStyles.color ?? '',
    },
  } as unknown as Document;

  // getComputedStyle mock: resolve var(--ls-xxx, SENTINEL) → value or sentinel
  const getComputed = vi.fn((_el: Element) => {
    // Parse var(--name, fallback) from the current color
    const match = currentColor.match(/var\((--[^,]+),\s*(.+)\)/);
    if (match) {
      const [, varName, fallback] = match;
      return { color: resolvedVars[varName] ?? fallback } as CSSStyleDeclaration;
    }
    return { color: currentColor || '' } as CSSStyleDeclaration;
  }) as unknown as typeof getComputedStyle;

  // For body fallback
  const bodyGetComputed = vi.fn(() => ({
    backgroundColor: bodyStyles.backgroundColor ?? '',
    color: bodyStyles.color ?? '',
  })) as unknown as typeof getComputedStyle;

  return Object.assign(doc, {
    _probes: probes,
    _getComputed: getComputed,
    _bodyGetComputed: bodyGetComputed,
  });
}

describe('themeSync', () => {
  let localRoot: HTMLElement & { _styles: Record<string, string> };

  beforeEach(() => {
    localRoot = mockElement() as HTMLElement & { _styles: Record<string, string> };
  });

  describe('probeAndApply', () => {
    it('applies resolved CSS variables to local root', () => {
      const vars = {
        '--ls-primary-background-color': 'rgb(22, 22, 24)',
        '--ls-primary-text-color': 'rgb(237, 237, 239)',
        '--ls-link-text-color': 'rgb(247, 97, 144)',
      };
      const doc = mockDocument(vars) as Document & { _getComputed: typeof getComputedStyle };

      const applied = probeAndApply(doc, localRoot, doc._getComputed);

      expect(applied).toBeGreaterThan(0);
      expect(localRoot.style.setProperty).toHaveBeenCalledWith('--vdt-bg', 'rgb(22, 22, 24)');
      expect(localRoot.style.setProperty).toHaveBeenCalledWith('--vdt-text', 'rgb(237, 237, 239)');
      expect(localRoot.style.setProperty).toHaveBeenCalledWith('--vdt-accent', 'rgb(247, 97, 144)');
      expect(localRoot.style.setProperty).toHaveBeenCalledWith('--vdt-link', 'rgb(247, 97, 144)');
    });

    it('returns 0 when no CSS variables resolve', () => {
      const doc = mockDocument({}) as Document & { _getComputed: typeof getComputedStyle };

      const applied = probeAndApply(doc, localRoot, doc._getComputed);

      expect(applied).toBe(0);
      expect(localRoot.style.setProperty).not.toHaveBeenCalled();
    });

    it('does not apply sentinel values', () => {
      // All variables fall back to sentinel
      const doc = mockDocument({}) as Document & { _getComputed: typeof getComputedStyle };

      probeAndApply(doc, localRoot, doc._getComputed);

      const calls = (localRoot.style.setProperty as ReturnType<typeof vi.fn>).mock.calls;
      for (const [, value] of calls) {
        expect(value).not.toBe(SENTINEL);
      }
    });

    it('removes probe element even if getComputedStyle throws', () => {
      const doc = mockDocument() as Document & { _probes: HTMLElement[] };
      const throwingGetComputed = vi.fn(() => {
        throw new Error('boom');
      }) as unknown as typeof getComputedStyle;

      expect(() => probeAndApply(doc, localRoot, throwingGetComputed)).toThrow('boom');

      // Probe should still be removed
      expect(doc._probes[0].remove).toHaveBeenCalled();
    });

    it('applies all COLOR_MAP entries when all vars resolve', () => {
      const vars: Record<string, string> = {};
      for (const { lsVar } of COLOR_MAP) {
        vars[lsVar] = `rgb(${Math.floor(Math.random() * 255)}, 100, 100)`;
      }
      const doc = mockDocument(vars) as Document & { _getComputed: typeof getComputedStyle };

      const applied = probeAndApply(doc, localRoot, doc._getComputed);

      expect(applied).toBe(COLOR_MAP.length);
    });
  });

  describe('applyBodyFallback', () => {
    it('applies body background and text color', () => {
      const doc = mockDocument(
        {},
        { backgroundColor: 'rgb(22, 22, 24)', color: 'rgb(237, 237, 239)' },
      );
      const bodyDoc = doc as Document & { _bodyGetComputed: typeof getComputedStyle };

      const result = applyBodyFallback(doc, localRoot, bodyDoc._bodyGetComputed);

      expect(result).toBe(true);
      expect(localRoot.style.setProperty).toHaveBeenCalledWith('--vdt-bg', 'rgb(22, 22, 24)');
      expect(localRoot.style.setProperty).toHaveBeenCalledWith('--vdt-text', 'rgb(237, 237, 239)');
    });

    it('returns false when body has no styles', () => {
      const doc = mockDocument({}, {});
      const bodyDoc = doc as Document & { _bodyGetComputed: typeof getComputedStyle };

      const result = applyBodyFallback(doc, localRoot, bodyDoc._bodyGetComputed);

      expect(result).toBe(false);
    });
  });

  describe('clearOverrides', () => {
    it('removes all vdt variables from local root', () => {
      clearOverrides(localRoot);

      const uniqueVars = new Set(COLOR_MAP.map((m) => m.vdtVar));
      expect(localRoot.style.removeProperty).toHaveBeenCalledTimes(uniqueVars.size);
      for (const v of uniqueVars) {
        expect(localRoot.style.removeProperty).toHaveBeenCalledWith(v);
      }
    });
  });
});
