import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UserRole } from './useRoles';

export interface UserWithRoles {
  user_id: string;
  email: string;
  name: string;
  created_at: string;
  roles: string[];
}

export interface AnalyticsSummary {
  total_users: number;
  total_events: number;
  event_type: string;
  event_count: number;
}

export const useAdminData = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_users_with_roles');
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_analytics_summary');
      if (error) throw error;
      setAnalytics(data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics',
        variant: 'destructive',
      });
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('email_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    }
  };

  const assignRole = async (userId: string, role: UserRole) => {
    try {
      const { error } = await supabase.rpc('assign_role', {
        _target_user_id: userId,
        _role: role as any,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Role ${role} assigned successfully`,
      });
      
      await fetchUsers();
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign role',
        variant: 'destructive',
      });
    }
  };

  const removeRole = async (userId: string, role: UserRole) => {
    try {
      const { error } = await supabase.rpc('remove_role', {
        _target_user_id: userId,
        _role: role as any,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Role ${role} removed successfully`,
      });
      
      await fetchUsers();
    } catch (error: any) {
      console.error('Error removing role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove role',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchAnalytics(), fetchNotifications()]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  return {
    users,
    analytics,
    notifications,
    loading,
    assignRole,
    removeRole,
    refreshUsers: fetchUsers,
    refreshAnalytics: fetchAnalytics,
    refreshNotifications: fetchNotifications,
  };
};
