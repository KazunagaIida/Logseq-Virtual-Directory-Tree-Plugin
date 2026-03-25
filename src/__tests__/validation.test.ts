import { describe, it, expect } from 'vitest';
import {
  validatePageName,
  checkCircularDrop,
  buildNewPath,
  buildNewPathForRoot,
} from '../utils/validation';

describe('validatePageName', () => {
  it('returns null for a valid page name', () => {
    expect(validatePageName('cooking/sous-vide')).toBeNull();
    expect(validatePageName('memo')).toBeNull();
    expect(validatePageName('dev/react/hooks')).toBeNull();
  });

  it.each(['#', '?', '[', ']', '{', '}', '|', '\\', '^'])(
    'returns error for name containing "%s"',
    (char) => {
      expect(validatePageName(`my${char}page`)).toBe(
        'Page name contains invalid characters'
      );
    }
  );
});

describe('checkCircularDrop', () => {
  it('returns true when dropping onto itself', () => {
    expect(checkCircularDrop('dev/react', 'dev/react')).toBe(true);
  });

  it('returns true when dropping into a descendant folder', () => {
    expect(checkCircularDrop('dev', 'dev/react')).toBe(true);
    expect(checkCircularDrop('dev/react', 'dev/react/hooks')).toBe(true);
  });

  it('returns false for an unrelated folder', () => {
    expect(checkCircularDrop('dev/react', 'cooking')).toBe(false);
    expect(checkCircularDrop('dev/react', 'dev/typescript')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(checkCircularDrop('Dev/React', 'dev/react')).toBe(true);
    expect(checkCircularDrop('dev', 'Dev/React')).toBe(true);
  });

  it('does not false-positive on prefix substrings', () => {
    // "develop" starts with "dev" but is not a child of "dev"
    expect(checkCircularDrop('dev', 'develop')).toBe(false);
  });
});

describe('buildNewPath', () => {
  it('moves a page to a different folder', () => {
    expect(buildNewPath('dev/react/hooks', 'cooking')).toBe('cooking/hooks');
  });

  it('moves a single-namespace page to another folder', () => {
    expect(buildNewPath('dev/hooks', 'cooking')).toBe('cooking/hooks');
  });

  it('moves into a nested folder', () => {
    expect(buildNewPath('dev/react/hooks', 'archive/2024')).toBe(
      'archive/2024/hooks'
    );
  });
});

describe('buildNewPathForRoot', () => {
  it('removes namespace and returns leaf name', () => {
    expect(buildNewPathForRoot('dev/react/hooks')).toBe('hooks');
  });

  it('returns the name as-is for a root-level page', () => {
    expect(buildNewPathForRoot('memo')).toBe('memo');
  });
});
