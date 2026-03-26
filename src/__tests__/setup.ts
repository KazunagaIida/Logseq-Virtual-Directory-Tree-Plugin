import { vi } from 'vitest';

// Global mock for Logseq Plugin API
const mockLogseq = {
  ready: (fn: Function) => Promise.resolve(fn()),
  Editor: {
    getAllPages: vi.fn().mockResolvedValue([]),
    renamePage: vi.fn().mockResolvedValue(undefined),
    getPage: vi.fn().mockResolvedValue(null),
    getCurrentPage: vi.fn().mockResolvedValue(null),
  },
  App: {
    pushState: vi.fn(),
    registerUIItem: vi.fn(),
    getUserConfigs: vi.fn().mockResolvedValue({}),
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

// @ts-ignore
globalThis.logseq = mockLogseq;
