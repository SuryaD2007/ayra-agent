import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { profileSchema, profileLinkSchema, validatePlatformUrl } from '@/lib/validations/profile';

export interface ProfileLink {
  id: string;
  title: string;
  url: string;
  display_order: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  description?: string;
  links: ProfileLink[];
}

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch profile links
      const { data: linksData, error: linksError } = await supabase
        .from('profile_links')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });

      if (linksError) throw linksError;

      setProfile({
        id: profileData.id,
        name: profileData.name,
        email: profileData.email,
        description: profileData.description,
        links: (linksData || []).map(link => ({
          id: link.id,
          title: link.title,
          url: link.url,
          display_order: link.display_order,
        })),
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: { name?: string; email?: string; description?: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to update your profile');
        return false;
      }

      // Validate data
      const validation = profileSchema.safeParse({
        name: updates.name || profile?.name,
        email: updates.email || profile?.email,
        description: updates.description,
      });

      if (!validation.success) {
        const firstError = validation.error.errors[0];
        toast.error(firstError.message);
        return false;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          email: updates.email,
          description: updates.description,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Profile updated successfully');
      return true;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      return false;
    }
  };

  const addLink = async (title: string, url: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to add links');
        return false;
      }

      // Validate link data
      const validation = profileLinkSchema.safeParse({ title, url });
      if (!validation.success) {
        const firstError = validation.error.errors[0];
        toast.error(firstError.message);
        return false;
      }

      // Validate platform-specific URL
      const platformError = validatePlatformUrl(title, url);
      if (platformError) {
        toast.error(platformError);
        return false;
      }

      const displayOrder = profile?.links.length || 0;

      const { data, error } = await supabase
        .from('profile_links')
        .insert({
          user_id: user.id,
          title,
          url,
          display_order: displayOrder,
        })
        .select()
        .single();

      if (error) throw error;

      const newLink: ProfileLink = {
        id: data.id,
        title: data.title,
        url: data.url,
        display_order: data.display_order,
      };

      setProfile(prev => prev ? {
        ...prev,
        links: [...prev.links, newLink],
      } : null);

      toast.success('Link added successfully');
      return true;
    } catch (error: any) {
      console.error('Error adding link:', error);
      toast.error('Failed to add link');
      return false;
    }
  };

  const updateLink = async (id: string, title: string, url: string) => {
    try {
      // Validate link data
      const validation = profileLinkSchema.safeParse({ title, url });
      if (!validation.success) {
        const firstError = validation.error.errors[0];
        toast.error(firstError.message);
        return false;
      }

      // Validate platform-specific URL
      const platformError = validatePlatformUrl(title, url);
      if (platformError) {
        toast.error(platformError);
        return false;
      }

      const { error } = await supabase
        .from('profile_links')
        .update({ title, url })
        .eq('id', id);

      if (error) throw error;

      setProfile(prev => prev ? {
        ...prev,
        links: prev.links.map(link => 
          link.id === id ? { ...link, title, url } : link
        ),
      } : null);

      return true;
    } catch (error: any) {
      console.error('Error updating link:', error);
      toast.error('Failed to update link');
      return false;
    }
  };

  const deleteLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profile_links')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProfile(prev => prev ? {
        ...prev,
        links: prev.links.filter(link => link.id !== id),
      } : null);

      toast.success('Link deleted successfully');
      return true;
    } catch (error: any) {
      console.error('Error deleting link:', error);
      toast.error('Failed to delete link');
      return false;
    }
  };

  useEffect(() => {
    fetchProfile();

    // Set up real-time subscription
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchProfile();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profile_links'
        },
        () => {
          fetchProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    profile,
    loading,
    updateProfile,
    addLink,
    updateLink,
    deleteLink,
    refetch: fetchProfile,
  };
};
