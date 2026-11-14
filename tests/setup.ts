/**
 * Global Test Setup & Browser Environment Polyfills
 * Supports offline-first client persistence and browser APIs in Node/Vitest test runner.
 */
import * as nodeCrypto from 'crypto';

class StorageMock implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return index >= 0 && index < keys.length ? keys[index] : null;
  }
}

// 1. Storage Polyfills
const localStorageMock = new StorageMock();
const sessionStorageMock = new StorageMock();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
  configurable: true,
});

// 2. Crypto Polyfill
if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', {
    value: (nodeCrypto as any).webcrypto || nodeCrypto,
    writable: true,
    configurable: true,
  });
}

if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = () => {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
  };
}

// 3. Window & Event Polyfills for Node environment
if (typeof (globalThis as any).window === 'undefined') {
  const fakeWindow: any = {
    location: {
      href: 'http://localhost:3000/',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: '',
      assign: () => {},
      replace: () => {},
      reload: () => {},
    },
    localStorage: localStorageMock,
    sessionStorage: sessionStorageMock,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    customElements: undefined,
  };

  Object.defineProperty(globalThis, 'window', {
    value: fakeWindow,
    writable: true,
    configurable: true,
  });
}

// Polyfill CustomEvent if missing
if (typeof (globalThis as any).CustomEvent === 'undefined') {
  class CustomEvent<T = any> extends Event {
    detail: T;
    constructor(message: string, initializationOptions?: { detail?: T; bubbles?: boolean; cancelable?: boolean }) {
      super(message, initializationOptions);
      this.detail = initializationOptions?.detail as T;
    }
  }
  Object.defineProperty(globalThis, 'CustomEvent', {
    value: CustomEvent,
    writable: true,
    configurable: true,
  });
}

// 4. Default Offline Fetch Mock to prevent socket timeouts
if (typeof globalThis.fetch !== 'undefined') {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (...args: any[]) => {
    // Immediate reject to trigger offline local storage fallback
    return Promise.reject(new Error('Network offline - local fallback'));
  };
}

// Reset storage before each test
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
