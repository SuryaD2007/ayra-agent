import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, BarChart3, Bell, Send } from 'lucide-react';
import UserManagement from '@/components/admin/UserManagement';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import NotificationsLog from '@/components/admin/NotificationsLog';
import BulkEmailComposer from '@/components/admin/BulkEmailComposer';
import EmailGroupsManager from '@/components/admin/EmailGroupsManager';
import IPBanManagement from '@/components/admin/IPBanManagement';
import { useAdminData } from '@/hooks/useAdminData';

const Admin = () => {
  const {
    users,
    analytics,
    notifications,
    loading,
    assignRole,
    removeRole,
    banUser,
    unbanUser,
    deleteUser,
  } = useAdminData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10 backdrop-blur-sm">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage users, view analytics, and monitor system notifications
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="glass-panel p-1.5 h-auto">
          <div className="grid w-full grid-cols-2 md:grid-cols-5 gap-1">
            <TabsTrigger value="users" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 hover-glow">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 hover-glow">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 hover-glow">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 hover-glow">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 hover-glow">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Bulk Email</span>
            </TabsTrigger>
          </div>
        </TabsList>

        <TabsContent value="users" className="space-y-4 animate-fade-in">
          <Card className="glass-panel hover-float border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                User Management
              </CardTitle>
              <CardDescription>
                View and manage user roles. Assign admin or moderator permissions to users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement
                users={users}
                onAssignRole={assignRole}
                onRemoveRole={removeRole}
                onBanUser={banUser}
                onUnbanUser={unbanUser}
                onDeleteUser={deleteUser}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 animate-fade-in">
          <div className="glass-panel hover-float border-border/50 rounded-lg">
            <AnalyticsDashboard analytics={analytics} />
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 animate-fade-in">
          <IPBanManagement />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 animate-fade-in">
          <Card className="glass-panel hover-float border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Email Notifications Log
              </CardTitle>
              <CardDescription>
                View all email notifications sent by the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationsLog notifications={notifications} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4 animate-fade-in">
          <div className="grid gap-4">
            <div className="glass-panel hover-float border-border/50 rounded-lg">
              <BulkEmailComposer />
            </div>
            <div className="glass-panel hover-float border-border/50 rounded-lg">
              <EmailGroupsManager />
            </div>
          </div>
        </TabsContent>
          </Tabs>
    </div>
  );
};

export default Admin;
