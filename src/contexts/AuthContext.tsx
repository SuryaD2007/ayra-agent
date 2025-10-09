
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { getItems, createSpace, createItem, upsertTag, setItemTags, DataCache } from '@/lib/data';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [migrationInProgress, setMigrationInProgress] = useState(false);

  // Convert base64 dataUrl to Blob
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Migration function to import localStorage items
  const migrateLocalStorageItems = async () => {
    if (!user || migrationInProgress) return;

    try {
      // Check if migration has already been completed
      const migrationCompleted = localStorage.getItem('ayra.migrated');
      if (migrationCompleted === 'true') {
        console.log('Migration already completed, skipping');
        return;
      }

      // Check if user has items in Supabase
      const result = await getItems({ page: 1, pageSize: 1 });
      if (result.total > 0) {
        console.log('User already has items in Supabase, skipping migration');
        // Mark as migrated to prevent future checks
        localStorage.setItem('ayra.migrated', 'true');
        return;
      }

      // Check if localStorage has items
      const localItems = localStorage.getItem('ayra.items');
      if (!localItems) {
        console.log('No local items to migrate');
        // Mark as migrated to prevent future checks
        localStorage.setItem('ayra.migrated', 'true');
        return;
      }

      const items = JSON.parse(localItems);
      if (!Array.isArray(items) || items.length === 0) {
        console.log('No valid local items to migrate');
        localStorage.setItem('ayra.migrated', 'true');
        return;
      }

      console.log(`Starting migration of ${items.length} items...`);
      setMigrationInProgress(true);

      // Create default spaces if missing
      const defaultSpaces = ['Personal', 'Work', 'School'];
      const spaceMap: Record<string, string> = {};
      
      for (const spaceName of defaultSpaces) {
        try {
          const space = await createSpace({ 
            name: spaceName, 
            emoji: spaceName === 'Personal' ? '👤' : spaceName === 'Work' ? '💼' : '🎓',
            visibility: 'private'
          });
          spaceMap[spaceName] = space.id;
        } catch (error) {
          console.warn(`Failed to create space ${spaceName}:`, error);
        }
      }

      let importedCount = 0;
      const failedItems: any[] = [];

      // Process each local item
      for (const localItem of items) {
        try {
          let payload: any = {
            title: localItem.title || 'Untitled',
            type: (localItem.type || 'note').toLowerCase(),
            content: localItem.content || localItem.description || '',
            source: localItem.source || 'Import',
            spaceId: spaceMap['Personal'], // Default to Personal space
            tags: localItem.keywords || localItem.tags || []
          };

          // Handle file upload for PDFs with dataUrl
          if (payload.type === 'pdf' && localItem.dataUrl) {
            try {
              const blob = dataUrlToBlob(localItem.dataUrl);
              // Use original filename if available, fallback to generated name
              const originalName = localItem.fileName || localItem.title || 'document.pdf';
              const file = new File([blob], originalName, { 
                type: 'application/pdf' 
              });
              payload.file = file;
            } catch (error) {
              console.warn('Failed to convert dataUrl to file:', error);
              failedItems.push(localItem);
              continue; // Skip this item
            }
          }

          // Handle links
          if (payload.type === 'link' && localItem.url) {
            payload.url = localItem.url;
          }

          // Create the item
          const createdItem = await createItem(payload);

          // Preserve created_at if available
          if (localItem.createdDate || localItem.created_at) {
            const createdAt = localItem.createdDate || localItem.created_at;
            try {
              await supabase
                .from('items')
                .update({ 
                  created_at: new Date(createdAt).toISOString() 
                })
                .eq('id', createdItem.id)
                .eq('user_id', user.id);
            } catch (error) {
              console.warn('Failed to update created_at for item:', localItem.title, error);
            }
          }

          importedCount++;
          console.log(`Migrated item ${importedCount}/${items.length}: ${localItem.title}`);
        } catch (error) {
          console.warn('Failed to migrate item:', localItem.title, error);
          failedItems.push(localItem);
        }
      }

      // Migration completed successfully
      if (importedCount > 0) {
        // Mark migration as completed BEFORE clearing localStorage
        localStorage.setItem('ayra.migrated', 'true');
        
        // Clear localStorage items
        localStorage.removeItem('ayra.items');
        
        // Clear cache to force refresh
        DataCache.clear();
        
        // Show success toast
        toast({
          title: "Import successful",
          description: `Imported ${importedCount} items from your device.${failedItems.length > 0 ? ` ${failedItems.length} items failed to import.` : ''}`,
        });

        console.log(`Migration completed: ${importedCount} items imported, ${failedItems.length} failed`);

        // Reload /manage page if we're currently there
        if (window.location.pathname === '/manage') {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        // No items were imported, still mark as migrated to prevent retries
        localStorage.setItem('ayra.migrated', 'true');
        console.log('Migration completed with no items imported');
      }

    } catch (error) {
      console.error('Migration failed:', error);
      toast({
        title: "Import failed",
        description: "Failed to import some items from your device. Please try again later.",
        variant: "destructive"
      });
      
      // Don't mark as migrated if there was a critical error
      // This allows retry on next login
    } finally {
      setMigrationInProgress(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setInitialized(true);

        // Trigger migration when user logs in
        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(() => {
            migrateLocalStorageItems();
          }, 100);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setInitialized(true);

      // Trigger migration for existing session
      if (session?.user) {
        setTimeout(() => {
          migrateLocalStorageItems();
        }, 100);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    // Clear all caches on logout
    DataCache.clear();
  };

  // Don't render children until auth is initialized
  if (!initialized) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ 
      user,
      session,
      isAuthenticated: !!user,
      login,
      signUp,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
