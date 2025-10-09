import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Users, BarChart3, Bell, Mail, Send } from 'lucide-react';
import UserManagement from '@/components/admin/UserManagement';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import NotificationsLog from '@/components/admin/NotificationsLog';
import EmailTester from '@/components/admin/EmailTester';
import BulkEmailComposer from '@/components/admin/BulkEmailComposer';
import EmailGroupsManager from '@/components/admin/EmailGroupsManager';
import { useAdminData } from '@/hooks/useAdminData';

const Admin = () => {
  const {
    users,
    analytics,
    notifications,
    loading,
    assignRole,
    removeRole,
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
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Manage users, view analytics, and monitor system notifications
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Test Email
          </TabsTrigger>
          <TabsTrigger value="bulk" className="gap-2">
            <Send className="h-4 w-4" />
            Bulk Email
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage user roles. Assign admin or moderator permissions to users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement
                users={users}
                onAssignRole={assignRole}
                onRemoveRole={removeRole}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard analytics={analytics} />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications Log</CardTitle>
              <CardDescription>
                View all email notifications sent by the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationsLog notifications={notifications} />
            </CardContent>
          </Card>
        </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <EmailTester />
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4">
              <div className="grid gap-4">
                <BulkEmailComposer />
                <EmailGroupsManager />
              </div>
            </TabsContent>
          </Tabs>
    </div>
  );
};

export default Admin;
