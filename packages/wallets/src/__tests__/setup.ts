// Mock TextEncoder
if (typeof TextEncoder === 'undefined') {
  const TextEncodingPolyfill = require('text-encoding');
  Object.assign(global, {
    TextEncoder: TextEncodingPolyfill.TextEncoder,
  });
}

// Mock Buffer
if (typeof Buffer === 'undefined') {
  const buffer = require('buffer');
  Object.assign(global, {
    Buffer: buffer.Buffer,
  });
}

// Mock window object
if (typeof window === 'undefined') {
  Object.assign(global, {
    window: {},
  });
}

// Mock EventEmitter
if (typeof EventEmitter === 'undefined') {
  const events = require('events');
  Object.assign(global, {
    EventEmitter: events.EventEmitter,
  });
}

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  // Remove any event listeners
  if (global.window.ethereum) {
    global.window.ethereum.removeAllListeners?.();
  }
  if (global.window.solana) {
    global.window.solana.removeAllListeners?.();
  }
}); 