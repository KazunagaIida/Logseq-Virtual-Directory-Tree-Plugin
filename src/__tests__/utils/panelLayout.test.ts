import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adjustMainContent, resetMainContent } from '../../utils/panelLayout';

describe('panelLayout', () => {
  beforeEach(() => {
    vi.mocked(logseq.provideStyle).mockClear();
  });

  it('adjustMainContent injects margin-right style via provideStyle', () => {
    adjustMainContent(280);
    expect(logseq.provideStyle).toHaveBeenCalledWith({
      key: 'vdt-main-content-adjust',
      style: expect.stringContaining('margin-right: 280px !important'),
    });
  });

  it('resetMainContent clears the injected style', () => {
    resetMainContent();
    expect(logseq.provideStyle).toHaveBeenCalledWith({
      key: 'vdt-main-content-adjust',
      style: '/* vdt-reset */',
    });
  });

  it('adjustMainContent does not throw', () => {
    expect(() => adjustMainContent(280)).not.toThrow();
  });

  it('resetMainContent does not throw when not previously adjusted', () => {
    expect(() => resetMainContent()).not.toThrow();
  });
});
