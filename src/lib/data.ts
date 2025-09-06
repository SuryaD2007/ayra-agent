import { supabase } from '@/integrations/supabase/client';

export interface Space {
  id: string;
  name: string;
  emoji?: string;
  visibility: 'private' | 'public';
  created_at: string;
  user_id: string;
}

export interface Item {
  id: string;
  title: string;
  type: 'note' | 'pdf' | 'link' | 'image';
  content?: string;
  file_path?: string;
  mime_type?: string;
  size_bytes?: number;
  source?: string;
  space_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Tag {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface GetItemsParams {
  page?: number;
  pageSize?: number;
  type?: string[];
  spaceId?: string;
  tags?: string[];
  dateRange?: {
    from?: string;
    to?: string;
  };
  search?: string;
}

export interface GetItemsResult {
  items: Item[];
  total: number;
}

// Error handling
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class FileUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileUploadError';
  }
}

// File upload validation and path generation
function validateFileUploadPath(userId: string, fileName: string): void {
  if (!userId || typeof userId !== 'string') {
    throw new FileUploadError('Valid user ID is required for file upload');
  }
  
  if (!fileName || typeof fileName !== 'string') {
    throw new FileUploadError('Valid file name is required');
  }
  
  // Check for suspicious patterns
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    throw new FileUploadError('Invalid characters in file name');
  }
}

function generateValidatedFilePath(userId: string, fileName: string): string {
  validateFileUploadPath(userId, fileName);
  
  // Create a safe, timestamped file path
  const timestamp = new Date().getTime();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${userId}/${timestamp}_${sanitizedFileName}`;
}

function isAuthError(error: any): boolean {
  return error?.message?.includes('JWT') || 
         error?.message?.includes('authentication') ||
         error?.message?.includes('unauthorized') ||
         error?.code === 'PGRST301';
}

async function withAuthErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new AuthError('User not authenticated. Please sign in to continue.');
    }
    
    return await operation();
  } catch (error) {
    if (isAuthError(error)) {
      throw new AuthError('Authentication required. Please sign in to continue.');
    }
    throw error;
  }
}

// Simple cache implementation
class DataCache {
  private static cache = new Map<string, { data: any; timestamp: number; duration: number }>();
  private static defaultDuration = 5 * 60 * 1000; // 5 minutes

  static set(key: string, data: any, duration = this.defaultDuration) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      duration
    });
  }

  static get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.duration) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  static clear(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Convenience methods for specific data types
  static setSpaces(data: Space[]) {
    this.set('spaces', data);
  }

  static getSpaces(): Space[] | null {
    return this.get('spaces');
  }

  static setItems(data: Item[]) {
    this.set('items', data);
  }

  static getItems(): Item[] | null {
    return this.get('items') || [];
  }

  static setTags(data: Tag[]) {
    this.set('tags', data);
  }

  static getTags(): Tag[] | null {
    return this.get('tags');
  }
}

export { DataCache };

// Spaces API
export async function getSpaces(): Promise<Space[]> {
  return withAuthErrorHandling(async () => {
    // Try cache first
    const cached = DataCache.getSpaces();
    if (cached) {
      return cached;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError('User not authenticated');

    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const spaces = data as Space[];
    DataCache.setSpaces(spaces);
    return spaces;
  });
}

export async function createSpace(payload: Omit<Space, 'id' | 'created_at' | 'user_id'>): Promise<Space> {
  return withAuthErrorHandling(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError('User not authenticated');

    const { data, error } = await supabase
      .from('spaces')
      .insert({
        ...payload,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Clear cache to force refresh
    DataCache.clear('spaces');

    return data as Space;
  });
}

// Items API
export async function getItems(params: GetItemsParams = {}): Promise<GetItemsResult> {
  return withAuthErrorHandling(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError('User not authenticated');

    let query = supabase
      .from('items')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Apply filters
    if (params.type && params.type.length > 0) {
      query = query.in('type', params.type);
    }

    if (params.spaceId) {
      query = query.eq('space_id', params.spaceId);
    }

    if (params.search) {
      // Use ilike for case-insensitive search across title and content
      query = query.or(`title.ilike.%${params.search}%,content.ilike.%${params.search}%`);
    }

    if (params.dateRange?.from) {
      query = query.gte('created_at', params.dateRange.from);
    }

    if (params.dateRange?.to) {
      query = query.lte('created_at', params.dateRange.to);
    }

    // Apply pagination
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      items: data as Item[],
      total: count || 0
    };
  });
}

export async function createItem(payload: {
  title: string;
  type: 'note' | 'pdf' | 'link' | 'image';
  content?: string;
  source?: string;
  space_id?: string;
  file?: File;
}): Promise<Item> {
  return withAuthErrorHandling(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError('User not authenticated');

    let fileData: { file_path?: string; mime_type?: string; size_bytes?: number } = {};

    // Handle file upload if provided
    if (payload.file) {
      const file = payload.file;
      
      try {
        // Validate and generate file path with strict format enforcement
        const filePath = generateValidatedFilePath(user.id, file.name);
        
        console.log(`Uploading file to: ayra-files/${filePath}`);
        
        const { error: uploadError } = await supabase.storage
          .from('ayra-files')
          .upload(filePath, file);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          throw new FileUploadError(`Failed to upload file: ${uploadError.message}`);
        }

        fileData = {
          file_path: filePath,
          mime_type: file.type,
          size_bytes: file.size
        };
      } catch (error) {
        console.error('File processing error:', error);
        if (error instanceof FileUploadError) {
          throw error;
        }
        throw new FileUploadError(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Prepare the item data for insertion
    const itemData = {
      title: payload.title,
      type: payload.type,
      content: payload.content,
      source: payload.source,
      space_id: payload.space_id,
      user_id: user.id,
      ...fileData
    };

    console.log('Creating item with data:', itemData);

    const { data, error } = await supabase
      .from('items')
      .insert(itemData)
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      throw error;
    }

    console.log('Item created successfully:', data);

    // Clear cache to force refresh
    DataCache.clear();

    return {
      ...data,
      type: data.type as 'note' | 'pdf' | 'link' | 'image'
    };
  });
}

export async function updateItem(id: string, payload: Partial<Item>): Promise<Item> {
  return withAuthErrorHandling(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError('User not authenticated');

    const { data, error } = await supabase
      .from('items')
      .update({
        ...payload,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Clear cache to force refresh
    DataCache.clear();

    return {
      ...data,
      type: data.type as 'note' | 'pdf' | 'link' | 'image'
    };
  });
}

export async function deleteItems(ids: string[]): Promise<void> {
  return withAuthErrorHandling(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError('User not authenticated');

    // Soft delete by setting deleted_at timestamp
    const { error } = await supabase
      .from('items')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .in('id', ids);

    if (error) throw error;

    // Clear cache to force refresh
    DataCache.clear();
  });
}

export async function restoreItem(id: string): Promise<Item> {
  return withAuthErrorHandling(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError('User not authenticated');

    const { data, error } = await supabase
      .from('items')
      .update({ 
        deleted_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Clear cache to force refresh
    DataCache.clear();

    return {
      ...data,
      type: data.type as 'note' | 'pdf' | 'link' | 'image'
    };
  });
}

export async function bulkMoveItems(itemIds: string[], targetSpaceId: string | null): Promise<void> {
  return withAuthErrorHandling(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError('User not authenticated');

    const { error } = await supabase
      .from('items')
      .update({ 
        space_id: targetSpaceId,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .in('id', itemIds);

    if (error) throw error;

    // Clear cache to force refresh
    DataCache.clear();
  });
}

export async function getSpaceCounts(): Promise<{ [spaceId: string]: number }> {
  return withAuthErrorHandling(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError('User not authenticated');

    const { data, error } = await supabase
      .from('items')
      .select('space_id')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (error) throw error;

    // Count items by space_id
    const counts: { [spaceId: string]: number } = {};
    data.forEach(item => {
      const spaceId = item.space_id || 'overview'; // Default to overview for items without space
      counts[spaceId] = (counts[spaceId] || 0) + 1;
    });

    return counts;
  });
}

// Tags API
export async function upsertTag(name: string): Promise<Tag> {
  return withAuthErrorHandling(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError('User not authenticated');

    // Try to find existing tag first
    const { data: existingTag } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', name.trim())
      .single();

    if (existingTag) {
      return existingTag as Tag;
    }

    // Create new tag if it doesn't exist
    const { data, error } = await supabase
      .from('tags')
      .insert({
        name: name.trim(),
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Clear cache
    DataCache.clear('tags');

    return data as Tag;
  });
}

export async function setItemTags(itemId: string, tagNames: string[]): Promise<void> {
  return withAuthErrorHandling(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError('User not authenticated');

    // Remove existing tag associations for this item
    await supabase
      .from('item_tags')
      .delete()
      .in('item_id', [itemId]);

    if (tagNames.length === 0) return;

    // Create or get tags
    const tagPromises = tagNames.map(name => upsertTag(name));
    const tags = await Promise.all(tagPromises);

    // Create new tag associations
    const associations = tags.map(tag => ({
      item_id: itemId,
      tag_id: tag.id
    }));

    const { error } = await supabase
      .from('item_tags')
      .insert(associations);

    if (error) throw error;

    // Clear cache
    DataCache.clear();
  });
}

export async function getTags(): Promise<Tag[]> {
  return withAuthErrorHandling(async () => {
    // Try cache first
    const cached = DataCache.getTags();
    if (cached) {
      return cached;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError('User not authenticated');

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) throw error;

    const tags = data as Tag[];
    DataCache.setTags(tags);
    return tags;
  });
}