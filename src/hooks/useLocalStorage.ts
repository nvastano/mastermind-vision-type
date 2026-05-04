import { useState } from 'react';

// Detect ISO date strings so Date objects survive JSON round-trips
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function reviver(_key: string, value: unknown): unknown {
  if (typeof value === 'string' && ISO_DATE_RE.test(value)) {
    return new Date(value);
  }
  return value;
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored, reviver) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof value === 'function'
        ? (value as (prev: T) => T)(prev)
        : value;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch (e) {
        console.warn('useLocalStorage: failed to write', key, e);
      }
      return next;
    });
  };

  return [state, setValue] as const;
}
