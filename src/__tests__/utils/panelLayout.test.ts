import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { adjustMainContent, resetMainContent } from '../../utils/panelLayout';

describe('panelLayout', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
    mockElement.id = 'main-content-container';
    document.body.appendChild(mockElement);

    // Make top.document point to our test document
    // In jsdom, top === window by default
  });

  afterEach(() => {
    resetMainContent();
    if (mockElement.parentNode) {
      document.body.removeChild(mockElement);
    }
  });

  it('adjustMainContent sets marginRight on found container', () => {
    adjustMainContent(280);
    expect(mockElement.style.marginRight).toBe('280px');
  });

  it('resetMainContent clears marginRight', () => {
    adjustMainContent(280);
    expect(mockElement.style.marginRight).toBe('280px');

    resetMainContent();
    expect(mockElement.style.marginRight).toBe('');
  });

  it('adjustMainContent does nothing when no selector matches', () => {
    document.body.removeChild(mockElement);
    // Should not throw
    expect(() => adjustMainContent(280)).not.toThrow();
  });

  it('resetMainContent does nothing when not previously adjusted', () => {
    // Should not throw
    expect(() => resetMainContent()).not.toThrow();
  });
});
