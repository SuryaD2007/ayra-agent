import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  platform: () => ipcRenderer.invoke('get-platform'),
  appVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Listen for events from main process
  onTriggerNewItem: (callback: () => void) => {
    ipcRenderer.on('trigger-new-item', callback);
    return () => ipcRenderer.removeListener('trigger-new-item', callback);
  },
  
  onDeepLink: (callback: (url: string) => void) => {
    ipcRenderer.on('deep-link', (_event, url) => callback(url));
    return () => ipcRenderer.removeAllListeners('deep-link');
  },
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electron: {
      platform: () => Promise<string>;
      appVersion: () => Promise<string>;
      onTriggerNewItem: (callback: () => void) => () => void;
      onDeepLink: (callback: (url: string) => void) => () => void;
    };
  }
}
