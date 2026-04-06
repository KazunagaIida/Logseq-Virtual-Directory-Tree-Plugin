import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyToClipboard } from '../../utils/clipboard';

describe('copyToClipboard', () => {
  let originalClipboard: Clipboard;
  let originalExecCommand: typeof document.execCommand;

  beforeEach(() => {
    originalClipboard = navigator.clipboard;
    // happy-dom may not define execCommand; ensure it exists for spying.
    originalExecCommand = document.execCommand;
    if (!document.execCommand) {
      document.execCommand = vi.fn().mockReturnValue(true);
    }
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
    document.execCommand = originalExecCommand;
    vi.restoreAllMocks();
  });

  it('always calls execCommand synchronously and also calls clipboard API when available', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });
    const execCommand = vi.spyOn(document, 'execCommand').mockReturnValue(true);

    const result = copyToClipboard('hello');
    expect(result).toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('works when clipboard API is unavailable', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    const execCommand = vi.spyOn(document, 'execCommand').mockReturnValue(true);

    const result = copyToClipboard('fallback text');
    expect(result).toBe(true);
    expect(execCommand).toHaveBeenCalledWith('copy');
  });

  it('returns false when execCommand fails', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    vi.spyOn(document, 'execCommand').mockReturnValue(false);

    const result = copyToClipboard('fail');
    expect(result).toBe(false);
  });

  it('returns false when execCommand throws', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });
    vi.spyOn(document, 'execCommand').mockImplementation(() => {
      throw new Error('not allowed');
    });

    const result = copyToClipboard('throw');
    expect(result).toBe(false);
  });
});
