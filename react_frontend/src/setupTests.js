 /* Setup for Jest + React Testing Library in jsdom environment */
import '@testing-library/jest-dom';

// Optional: stub features that may not exist in jsdom to avoid noisy logs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = window.ResizeObserver || ResizeObserverMock;

// Provide a minimal Response polyfill for custom fetch mocks if not present
if (typeof global.Response === 'undefined') {
  global.Response = class {
    constructor(body, init = {}) {
      this._body = typeof body === 'string' ? body : JSON.stringify(body ?? '');
      this.status = init.status || 200;
      this.statusText = init.statusText || '';
      this.headers = new Map(Object.entries(init.headers || {}));
      this.ok = this.status >= 200 && this.status < 300;
    }
    async json() {
      try {
        return JSON.parse(this._body);
      } catch {
        return this._body;
      }
    }
    async text() {
      return this._body;
    }
  };
}

// Default no-op fetch mock so tests that don't set specific handlers still avoid network
beforeAll(() => {
  if (!global.fetch) {
    global.fetch = jest.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
  }
});

afterEach(() => {
  if (global.fetch && 'mockClear' in global.fetch) {
    global.fetch.mockClear();
  }
});
