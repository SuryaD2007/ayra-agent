
import React from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PasswordManagement } from '@/components/auth/PasswordManagement';
import { useRoles } from '@/hooks/useRoles';
import RoleBadge from '@/components/admin/RoleBadge';

const Settings = () => {
  const showContent = useAnimateIn(false, 300);
  const navigate = useNavigate();
  const { roles, isAdmin, isModerator } = useRoles();
  
  return (
    <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
      <AnimatedTransition show={showContent} animation="slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Customize your digital second brain
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className={`grid w-full mb-8 ${(isAdmin() || isModerator()) ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              {(isAdmin() || isModerator()) && (
                <TabsTrigger value="admin">Admin</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Manage your account settings and preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-save" className="text-base">Auto-save</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically save changes as you work
                      </p>
                    </div>
                    <Switch id="auto-save" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifications" className="text-base">Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about updates and activity
                      </p>
                    </div>
                    <Switch id="notifications" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="ai-suggestions" className="text-base">AI Suggestions</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow AI to provide content suggestions
                      </p>
                    </div>
                    <Switch id="ai-suggestions" defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <div className="space-y-6">
                <PasswordManagement />
                
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                    <CardDescription>
                      Control your data privacy and security options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="auto-lock" className="text-base">Auto-lock Private Items</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically lock private items after 30 minutes of inactivity
                        </p>
                      </div>
                      <Switch id="auto-lock" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="secure-delete" className="text-base">Secure Delete</Label>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete files instead of moving to trash
                        </p>
                      </div>
                      <Switch id="secure-delete" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize how your second brain looks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="dark-mode" className="text-base">Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Toggle between light and dark themes
                      </p>
                    </div>
                    <Switch id="dark-mode" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="animations" className="text-base">Animations</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable smooth transitions and animations
                      </p>
                    </div>
                    <Switch id="animations" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="compact-view" className="text-base">Compact View</Label>
                      <p className="text-sm text-muted-foreground">
                        Display more content with less spacing
                      </p>
                    </div>
                    <Switch id="compact-view" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="integrations">
              <Card>
                <CardHeader>
                  <CardTitle>Integrations</CardTitle>
                  <CardDescription>
                    Connect your second brain with external services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="google-drive" className="text-base">Google Drive</Label>
                      <p className="text-sm text-muted-foreground">
                        Import and sync files from Google Drive
                      </p>
                    </div>
                    <Switch id="google-drive" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notion" className="text-base">Notion</Label>
                      <p className="text-sm text-muted-foreground">
                        Sync with your Notion workspaces
                      </p>
                    </div>
                    <Switch id="notion" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="github" className="text-base">GitHub</Label>
                      <p className="text-sm text-muted-foreground">
                        Connect to your GitHub repositories
                      </p>
                    </div>
                    <Switch id="github" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {(isAdmin() || isModerator()) && (
              <TabsContent value="admin">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Admin Panel
                    </CardTitle>
                    <CardDescription>
                      Access administrative features and system management
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base mb-2 block">Your Roles</Label>
                        <div className="flex gap-2">
                          {roles.map((role) => (
                            <RoleBadge key={role} role={role} />
                          ))}
                        </div>
                      </div>
                      
                      {isAdmin() && (
                        <div className="pt-4 border-t">
                          <Button 
                            onClick={() => navigate('/admin')}
                            className="w-full sm:w-auto gap-2"
                          >
                            <Shield className="h-4 w-4" />
                            Open Admin Dashboard
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <p className="text-sm text-muted-foreground mt-2">
                            Manage users, view analytics, and configure system settings
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </AnimatedTransition>
    </div>
  );
};

export default Settings;
