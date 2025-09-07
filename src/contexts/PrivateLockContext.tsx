import React, { createContext, useContext, useState, useCallback } from 'react';

interface PrivateLockContextType {
  isPrivateLocked: boolean;
  unlockedUntil: number | null;
  unlockPrivate: (password: string) => boolean;
  lockPrivate: () => void;
  isPrivateUnlocked: () => boolean;
}

const PrivateLockContext = createContext<PrivateLockContextType | undefined>(undefined);

const PRIVATE_PASSWORD = 'unlock'; // You can make this configurable
const UNLOCK_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export function PrivateLockProvider({ children }: { children: React.ReactNode }) {
  const [isPrivateLocked, setIsPrivateLocked] = useState(true);
  const [unlockedUntil, setUnlockedUntil] = useState<number | null>(null);

  const unlockPrivate = useCallback((password: string): boolean => {
    if (password === PRIVATE_PASSWORD) {
      const unlockTime = Date.now() + UNLOCK_DURATION;
      setIsPrivateLocked(false);
      setUnlockedUntil(unlockTime);
      
      // Auto-lock after duration
      setTimeout(() => {
        setIsPrivateLocked(true);
        setUnlockedUntil(null);
      }, UNLOCK_DURATION);
      
      return true;
    }
    return false;
  }, []);

  const lockPrivate = useCallback(() => {
    setIsPrivateLocked(true);
    setUnlockedUntil(null);
  }, []);

  const isPrivateUnlocked = useCallback((): boolean => {
    if (unlockedUntil && Date.now() < unlockedUntil) {
      return true;
    }
    if (unlockedUntil && Date.now() >= unlockedUntil) {
      setIsPrivateLocked(true);
      setUnlockedUntil(null);
    }
    return !isPrivateLocked;
  }, [isPrivateLocked, unlockedUntil]);

  return (
    <PrivateLockContext.Provider value={{
      isPrivateLocked,
      unlockedUntil,
      unlockPrivate,
      lockPrivate,
      isPrivateUnlocked
    }}>
      {children}
    </PrivateLockContext.Provider>
  );
}

export function usePrivateLock() {
  const context = useContext(PrivateLockContext);
  if (context === undefined) {
    throw new Error('usePrivateLock must be used within a PrivateLockProvider');
  }
  return context;
}