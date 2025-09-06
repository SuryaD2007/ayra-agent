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
  page: number;
  pageSize: number;
}

// Auth error types
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// Check if error is auth related (401/403)
const isAuthError = (error: any): boolean => {
  if (error?.code) {
    return error.code === 'PGRST301' || error.code === 'PGRST302'; // RLS errors
  }
  if (error?.message) {
    return error.message.includes('JWT') || 
           error.message.includes('auth') ||
           error.message.includes('401') ||
           error.message.includes('403') ||
           error.message.includes('permission');
  }
  return false;
};

// Wrapper for Supabase operations with auth error handling
const withAuthErrorHandling = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new AuthError('Please sign in to access this feature.');
    }
    
    return await operation();
  } catch (error) {
    if (isAuthError(error)) {
      throw new AuthError('Please sign in to access this feature.');
    }
    throw error;
  }
};

// Simple client-side cache
export class DataCache {
  private static items: any[] = [];
  private static spaces: Space[] = [];
  private static tags: Tag[] = [];
  private static lastUpdate = 0;
  private static CACHE_DURATION = 30000; // 30 seconds

  static isExpired(): boolean {
    return Date.now() - this.lastUpdate > this.CACHE_DURATION;
  }

  static setItems(items: any[]): void {
    this.items = items;
    this.lastUpdate = Date.now();
  }

  static getItems(): any[] {
    return this.isExpired() ? [] : this.items;
  }

  static setSpaces(spaces: Space[]): void {
    this.spaces = spaces;
    this.lastUpdate = Date.now();
  }

  static getSpaces(): Space[] {
    return this.isExpired() ? [] : this.spaces;
  }

  static setTags(tags: Tag[]): void {
    this.tags = tags;
    this.lastUpdate = Date.now();
  }

  static getTags(): Tag[] {
    return this.isExpired() ? [] : this.tags;
  }

  static clear(): void {
    this.items = [];
    this.spaces = [];
    this.tags = [];
    this.lastUpdate = 0;
  }
}

// Spaces CRUD
export async function getSpaces(): Promise<Space[]> {
  return withAuthErrorHandling(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError('User not authenticated');

    // Check cache first
    const cached = DataCache.getSpaces();
    if (cached.length > 0) return cached;

    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const spaces = (data || []).map(space => ({
      ...space,
      visibility: space.visibility as 'private' | 'public'
    }));
    DataCache.setSpaces(spaces);
    return spaces;
  });
}

export async function createSpace(payload: { name: string; emoji?: string; visibility?: 'private' | 'public' }): Promise<Space> {
  return withAuthErrorHandling(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError('User not authenticated');

    const { data, error } = await supabase
      .from('spaces')
      .insert({
        name: payload.name,
        emoji: payload.emoji,
        visibility: payload.visibility || 'private',
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Clear cache to force refresh
    DataCache.clear();
    
    return {
      ...data,
      visibility: data.visibility as 'private' | 'public'
    };
  });
}

// Items CRUD
export async function getItems(params: GetItemsParams = {}): Promise<GetItemsResult> {
  return withAuthErrorHandling(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError('User not authenticated');

    const {
      page = 1,
      pageSize = 25,
      type = [],
      spaceId,
      tags = [],
      dateRange = {},
      search = ''
    } = params;

    let query = supabase
      .from('items')
      .select('*, item_tags(tag_id)', { count: 'exact' })
      .is('deleted_at', null);

    // Apply filters
    if (type.length > 0) {
      query = query.in('type', type);
    }

    if (spaceId) {
      query = query.eq('space_id', spaceId);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    if (dateRange.from) {
      query = query.gte('created_at', dateRange.from);
    }

    if (dateRange.to) {
      query = query.lte('created_at', dateRange.to);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    const items = (data || []).map(item => ({
      ...item,
      type: item.type as 'note' | 'pdf' | 'link' | 'image'
    }));

    return {
      items,
      total: count || 0,
      page,
      pageSize
    };
  });
}

export async function createItem(payload: any): Promise<Item> {
  return withAuthErrorHandling(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError('User not authenticated');

    let fileData = {};

    // Handle file upload if present
    if (payload.file) {
      const file = payload.file;
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}-${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ayra-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      fileData = {
        file_path: filePath,
        mime_type: file.type,
        size_bytes: file.size
      };
    }

    // Extract/enhance content based on type
    let content = payload.content || '';
    
    if (payload.type === 'link' && payload.url && !content) {
      try {
        // Call edge function to extract content
        const { data: extracted } = await supabase.functions
          .invoke('extract-content', {
            body: { url: payload.url }
          });
        
        if (extracted?.content) {
          content = extracted.content;
        }
      } catch (error) {
        console.warn('Content extraction failed:', error);
      }
    }

    const { data, error } = await supabase
      .from('items')
      .insert({
        title: payload.title,
        type: payload.type.toLowerCase(),
        content,
        source: payload.source || payload.url || 'Upload',
        space_id: payload.spaceId,
        user_id: user.id,
        ...fileData
      })
      .select()
      .single();

    if (error) throw error;

    // Handle tags if provided
    if (payload.tags && payload.tags.length > 0) {
      await setItemTags(data.id, payload.tags);
    }

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

    const { error } = await supabase
      .from('items')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', ids)
      .eq('user_id', user.id);

    if (error) throw error;

    // Clear cache to force refresh
    DataCache.clear();
  });
}

// Tags CRUD
export async function upsertTag(name: string): Promise<Tag> {
  return withAuthErrorHandling(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError('User not authenticated');

    // Check if tag exists
    const { data: existing } = await supabase
      .from('tags')
      .select()
      .eq('name', name)
      .eq('user_id', user.id)
      .single();

    if (existing) return existing;

    // Create new tag
    const { data, error } = await supabase
      .from('tags')
      .insert({
        name,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  });
}

export async function setItemTags(itemId: string, tagNames: string[]): Promise<void> {
  return withAuthErrorHandling(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError('User not authenticated');

    // Remove existing tags for this item
    await supabase
      .from('item_tags')
      .delete()
      .eq('item_id', itemId);

    if (tagNames.length === 0) return;

    // Upsert all tags
    const tags = await Promise.all(
      tagNames.map(name => upsertTag(name))
    );

    // Create tag associations
    const tagAssociations = tags.map(tag => ({
      item_id: itemId,
      tag_id: tag.id
    }));

    const { error } = await supabase
      .from('item_tags')
      .insert(tagAssociations);

    if (error) throw error;
  });
}

export async function getTags(): Promise<Tag[]> {
  return withAuthErrorHandling(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AuthError('User not authenticated');

    // Check cache first
    const cached = DataCache.getTags();
    if (cached.length > 0) return cached;

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');

    if (error) throw error;

    DataCache.setTags(data || []);
    return data || [];
  });
}