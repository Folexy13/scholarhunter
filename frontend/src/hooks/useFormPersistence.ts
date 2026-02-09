import { useEffect, useState, useRef } from 'react';

/**
 * Custom hook to persist form data in localStorage
 * @param key - Unique key for storing the form data
 * @param initialValue - Initial value for the form
 * @param debounceMs - Debounce time in milliseconds (default: 500ms)
 */
export function useFormPersistence<T>(
  key: string,
  initialValue: T,
  debounceMs: number = 500
): [T, (value: T) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    // Try to load from localStorage on mount
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch (error) {
      console.error(`Error loading persisted form data for key "${key}":`, error);
      return initialValue;
    }
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save to localStorage with debouncing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to save after debounce period
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Error saving form data for key "${key}":`, error);
      }
    }, debounceMs);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, key, debounceMs]);

  // Function to clear persisted data
  const clearPersistedData = () => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
      setValue(initialValue);
    } catch (error) {
      console.error(`Error clearing persisted form data for key "${key}":`, error);
    }
  };

  return [value, setValue, clearPersistedData];
}
