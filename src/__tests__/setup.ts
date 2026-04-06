import { vi } from 'vitest';

// Global mock for Logseq Plugin API
const mockLogseq = {
  ready: (fn: () => unknown) => Promise.resolve(fn()),
  Editor: {
    getAllPages: vi.fn().mockResolvedValue([]),
    renamePage: vi.fn().mockResolvedValue(undefined),
    getPage: vi.fn().mockResolvedValue(null),
    getCurrentPage: vi.fn().mockResolvedValue(null),
    createPage: vi.fn().mockResolvedValue(undefined),
    appendBlockInPage: vi.fn().mockResolvedValue(undefined),
    deletePage: vi.fn().mockResolvedValue(undefined),
  },
  App: {
    pushState: vi.fn(),
    registerUIItem: vi.fn(),
    getUserConfigs: vi.fn().mockResolvedValue({}),
  },
  UI: {
    resolveThemeCssPropsVals: vi.fn().mockResolvedValue(null),
  },
  DB: {
    onChanged: vi.fn(),
  },
  provideUI: vi.fn(),
  provideModel: vi.fn(),
  provideStyle: vi.fn(),
  updateSettings: vi.fn(),
  settings: {},
};

// @ts-expect-error logseq global is not typed on globalThis
globalThis.logseq = mockLogseq;
