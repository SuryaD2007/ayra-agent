import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface PrivateLockContextType {
  isPrivateLocked: boolean;
  unlockedUntil: number | null;
  hasPassword: boolean;
  unlockPrivate: (password: string) => boolean;
  lockPrivate: () => void;
  isPrivateUnlocked: () => boolean;
  setPrivatePassword: (password: string) => void;
  changePassword: (oldPassword: string, newPassword: string) => boolean;
  resetPassword: () => void;
}

const PrivateLockContext = createContext<PrivateLockContextType | undefined>(undefined);

const UNLOCK_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const STORAGE_KEY = 'private_password_hash';

// Simple hash function for password storage (in a real app, use proper encryption)
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

export const PrivateLockProvider = ({ children }: { children: React.ReactNode }) => {
  const [isPrivateLocked, setIsPrivateLocked] = useState(true);
  const [unlockedUntil, setUnlockedUntil] = useState<number | null>(null);
  const [passwordHash, setPasswordHash] = useState<string | null>(null);

  // Load password hash from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPasswordHash(stored);
      }
    } catch (error) {
      console.error('Error loading password hash:', error);
    }
  }, []);

  const setPrivatePassword = useCallback((password: string) => {
    const hash = hashPassword(password);
    setPasswordHash(hash);
    try {
      localStorage.setItem(STORAGE_KEY, hash);
    } catch (error) {
      console.error('Error storing password hash:', error);
    }
  }, []);

  const unlockPrivate = useCallback((password: string): boolean => {
    if (!passwordHash) return false;
    
    if (hashPassword(password) === passwordHash) {
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
  }, [passwordHash]);

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

  const changePassword = useCallback((oldPassword: string, newPassword: string): boolean => {
    if (!passwordHash) return false;
    
    if (hashPassword(oldPassword) === passwordHash) {
      setPrivatePassword(newPassword);
      return true;
    }
    return false;
  }, [passwordHash, setPrivatePassword]);

  const resetPassword = useCallback(() => {
    setPasswordHash(null);
    setIsPrivateLocked(true);
    setUnlockedUntil(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error removing password hash:', error);
    }
  }, []);

  const value = {
    isPrivateLocked,
    unlockedUntil,
    hasPassword: !!passwordHash,
    unlockPrivate,
    lockPrivate,
    isPrivateUnlocked,
    setPrivatePassword,
    changePassword,
    resetPassword
  };

  return (
    <PrivateLockContext.Provider value={value}>
      {children}
    </PrivateLockContext.Provider>
  );
};

export const usePrivateLock = () => {
  const context = useContext(PrivateLockContext);
  if (context === undefined) {
    throw new Error('usePrivateLock must be used within a PrivateLockProvider');
  }
  return context;
};