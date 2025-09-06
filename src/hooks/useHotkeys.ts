import { useEffect, useRef } from 'react';

export interface HotkeyConfig {
  key: string;
  action: () => void;
  condition?: () => boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export const useHotkeys = (hotkeys: HotkeyConfig[]) => {
  const activeHotkeysRef = useRef<HotkeyConfig[]>([]);

  useEffect(() => {
    activeHotkeysRef.current = hotkeys;
  }, [hotkeys]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger hotkeys when typing in inputs, textareas, or contenteditable elements
      const target = event.target as HTMLElement;
      const isInputElement = target.matches('input, textarea, [contenteditable]');
      
      for (const hotkey of activeHotkeysRef.current) {
        // Check if the key matches
        const keyMatch = event.key.toLowerCase() === hotkey.key.toLowerCase();
        
        if (!keyMatch) continue;

        // Check condition if provided
        if (hotkey.condition && !hotkey.condition()) continue;

        // Special handling for '/' - don't trigger if already in an input
        if (hotkey.key === '/' && isInputElement) continue;

        // For non-'/' keys, check if we should skip input elements
        if (hotkey.key !== '/' && isInputElement) continue;

        if (hotkey.preventDefault !== false) {
          event.preventDefault();
        }
        
        if (hotkey.stopPropagation !== false) {
          event.stopPropagation();
        }

        hotkey.action();
        break; // Only trigger the first matching hotkey
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};

export const formatHotkey = (key: string) => {
  const keyMap: Record<string, string> = {
    '/': '/',
    'f': 'F',
    'n': 'N', 
    'j': 'J',
    'k': 'K',
    'Enter': '↵',
    'Escape': 'Esc',
  };
  return keyMap[key] || key;
};