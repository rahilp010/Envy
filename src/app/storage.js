import { MMKV } from 'react-native-mmkv';

let storageInstance = null;

try {
  storageInstance = new MMKV({
    id: 'envy-mobile-storage',
  });
} catch (e) {
  console.warn('MMKV initialization warning, using in-memory fallback:', e.message);
  const memoryStore = new Map();
  storageInstance = {
    getString: (key) => memoryStore.get(key) || null,
    set: (key, val) => memoryStore.set(key, val),
    delete: (key) => memoryStore.delete(key),
    clearAll: () => memoryStore.clear(),
  };
}

export const loadFromStorage = (key, fallback = []) => {
  try {
    const stored = storageInstance.getString(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const _pendingWrites = new Map();
let _flushScheduled = false;

function flushWrites() {
  _flushScheduled = false;
  for (const [key, data] of _pendingWrites) {
    try {
      storageInstance.set(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to storage:', key, e);
    }
  }
  _pendingWrites.clear();
}

export const saveToStorage = (key, data) => {
  _pendingWrites.set(key, data);
  if (!_flushScheduled) {
    _flushScheduled = true;
    setTimeout(flushWrites, 50);
  }
};

export default storageInstance;
