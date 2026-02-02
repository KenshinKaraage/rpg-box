import '@testing-library/jest-dom';

// structuredClone polyfill for fake-indexeddb
if (typeof structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}
