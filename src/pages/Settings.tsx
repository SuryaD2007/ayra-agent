import React from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, ExternalLink, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PasswordManagement } from '@/components/auth/PasswordManagement';
import { useRoles } from '@/hooks/useRoles';
import RoleBadge from '@/components/admin/RoleBadge';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/contexts/ThemeContext';
import { GoogleDriveConnection } from '@/components/settings/GoogleDriveConnection';
import { NotionConnection } from '@/components/settings/NotionConnection';
import { GitHubConnection } from '@/components/settings/GitHubConnection';
const Settings = () => {
  const showContent = useAnimateIn(false, 300);
  const navigate = useNavigate();
  const {
    roles,
    isAdmin,
    isModerator
  } = useRoles();
  const {
    settings,
    updateSetting,
    loading
  } = useSettings();
  const {
    theme,
    toggleTheme
  } = useTheme();

  // Sync theme with settings on mount
  React.useEffect(() => {
    if (!loading) {
      const isDark = theme === 'dark';
      if (settings.darkMode !== isDark) {
        updateSetting('darkMode', isDark);
      }
    }
  }, [theme, loading]);
  return <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
      <AnimatedTransition show={showContent} animation="slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Customize your digital second brain
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className={`grid w-full mb-8 ${isAdmin() || isModerator() ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              {(isAdmin() || isModerator()) && <TabsTrigger value="admin">Admin</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="general">
              <Card className="animate-fade-in border-border/50 backdrop-blur-sm bg-card/50 shadow-lg hover:shadow-xl transition-all duration-500">
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Manage your account settings and preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div> : <>
                      <div className="group flex items-center justify-between p-4 rounded-xl transition-all duration-500 hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md animate-fade-in border border-transparent hover:border-border/50" style={{
                    animationDelay: '0.1s',
                    animationFillMode: 'backwards'
                  }}>
                        <div className="transition-transform duration-300 group-hover:translate-x-1">
                          <Label htmlFor="auto-save" className="text-base font-medium cursor-pointer">Auto-save</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Automatically save changes as you work
                          </p>
                        </div>
                        <Switch id="auto-save" checked={settings.autoSave} onCheckedChange={checked => updateSetting('autoSave', checked)} className="transition-all duration-300 hover:scale-110" />
                      </div>
                      
                      <div className="group flex items-center justify-between p-4 rounded-xl transition-all duration-500 hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md animate-fade-in border border-transparent hover:border-border/50" style={{
                    animationDelay: '0.2s',
                    animationFillMode: 'backwards'
                  }}>
                        <div className="transition-transform duration-300 group-hover:translate-x-1">
                          <Label htmlFor="notifications" className="text-base font-medium cursor-pointer">Notifications</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Receive notifications about updates and activity
                          </p>
                        </div>
                        <Switch id="notifications" checked={settings.notifications} onCheckedChange={checked => updateSetting('notifications', checked)} className="transition-all duration-300 hover:scale-110" />
                      </div>
                      
                      <div className="group flex items-center justify-between p-4 rounded-xl transition-all duration-500 hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md animate-fade-in border border-transparent hover:border-border/50" style={{
                    animationDelay: '0.3s',
                    animationFillMode: 'backwards'
                  }}>
                        <div className="transition-transform duration-300 group-hover:translate-x-1">
                          <Label htmlFor="ai-suggestions" className="text-base font-medium cursor-pointer">AI Suggestions</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Allow AI to provide content suggestions
                          </p>
                        </div>
                        <Switch id="ai-suggestions" checked={settings.aiSuggestions} onCheckedChange={checked => updateSetting('aiSuggestions', checked)} className="transition-all duration-300 hover:scale-110" />
                      </div>
                    </>}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <div className="space-y-6">
                <div className="animate-fade-in" style={{
                animationDelay: '0.1s',
                animationFillMode: 'backwards'
              }}>
                  <PasswordManagement />
                </div>
                
                <Card className="animate-fade-in border-border/50 backdrop-blur-sm bg-card/50 shadow-lg hover:shadow-xl transition-all duration-500" style={{
                animationDelay: '0.2s',
                animationFillMode: 'backwards'
              }}>
                  <CardHeader>
                    <CardTitle>Privacy Settings</CardTitle>
                    <CardDescription>
                      Control your data privacy and security options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loading ? <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div> : <>
                        <div className="group flex items-center justify-between p-4 rounded-xl transition-all duration-500 hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md border border-transparent hover:border-border/50">
                          <div className="transition-transform duration-300 group-hover:translate-x-1">
                            <Label htmlFor="auto-lock" className="text-base font-medium cursor-pointer">Auto-lock Private Items</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Automatically lock private items after 30 minutes of inactivity
                            </p>
                          </div>
                          <Switch id="auto-lock" checked={settings.autoLock} onCheckedChange={checked => updateSetting('autoLock', checked)} className="transition-all duration-300 hover:scale-110" />
                        </div>
                        
                        <div className="group flex items-center justify-between p-4 rounded-xl transition-all duration-500 hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md border border-transparent hover:border-border/50">
                          <div className="transition-transform duration-300 group-hover:translate-x-1">
                            <Label htmlFor="secure-delete" className="text-base font-medium cursor-pointer">Secure Delete</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Permanently delete files instead of moving to trash
                            </p>
                          </div>
                          <Switch id="secure-delete" checked={settings.secureDelete} onCheckedChange={checked => updateSetting('secureDelete', checked)} className="transition-all duration-300 hover:scale-110" />
                        </div>
                      </>}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="appearance">
              <Card className="animate-fade-in border-border/50 backdrop-blur-sm bg-card/50 shadow-lg hover:shadow-xl transition-all duration-500">
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize how your second brain looks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {loading ? <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div> : <>
                      <div className="group flex items-center justify-between p-4 rounded-xl transition-all duration-500 hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md animate-fade-in border border-transparent hover:border-border/50" style={{
                    animationDelay: '0.1s',
                    animationFillMode: 'backwards'
                  }}>
                        <div className="transition-transform duration-300 group-hover:translate-x-1">
                          <Label htmlFor="dark-mode" className="text-base font-medium cursor-pointer">Dark Mode</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Toggle between light and dark themes
                          </p>
                        </div>
                        <Switch id="dark-mode" checked={theme === 'dark'} onCheckedChange={() => {
                      toggleTheme();
                      updateSetting('darkMode', theme === 'light');
                    }} className="transition-all duration-300 hover:scale-110" />
                      </div>
                      
                      <div className="group flex items-center justify-between p-4 rounded-xl transition-all duration-500 hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md animate-fade-in border border-transparent hover:border-border/50" style={{
                    animationDelay: '0.2s',
                    animationFillMode: 'backwards'
                  }}>
                        <div className="transition-transform duration-300 group-hover:translate-x-1">
                          <Label htmlFor="animations" className="text-base font-medium cursor-pointer">Animations</Label>
                          <p className="text-sm text-muted-foreground mt-1">Enable smooth transitions and animations

(Reload Screen)
                      </p>
                        </div>
                        <Switch id="animations" checked={settings.animations} onCheckedChange={checked => updateSetting('animations', checked)} className="transition-all duration-300 hover:scale-110" />
                      </div>
                      
                      <div className="group flex items-center justify-between p-4 rounded-xl transition-all duration-500 hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md animate-fade-in border border-transparent hover:border-border/50" style={{
                    animationDelay: '0.3s',
                    animationFillMode: 'backwards'
                  }}>
                        <div className="transition-transform duration-300 group-hover:translate-x-1">
                          <Label htmlFor="compact-view" className="text-base font-medium cursor-pointer">Compact View</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Display more content with less spacing
                          </p>
                        </div>
                        <Switch id="compact-view" checked={settings.compactView} onCheckedChange={checked => updateSetting('compactView', checked)} className="transition-all duration-300 hover:scale-110" />
                      </div>
                    </>}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="integrations" className="space-y-6">
              <GoogleDriveConnection />
              <NotionConnection />
              <GitHubConnection />
            </TabsContent>
            
            {(isAdmin() || isModerator()) && <TabsContent value="admin">
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
                          {roles.map(role => <RoleBadge key={role} role={role} />)}
                        </div>
                      </div>
                      
                      {isAdmin() && <div className="pt-4 border-t">
                          <Button onClick={() => navigate('/admin')} className="w-full sm:w-auto gap-2">
                            <Shield className="h-4 w-4" />
                            Open Admin Dashboard
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <p className="text-sm text-muted-foreground mt-2">
                            Manage users, view analytics, and configure system settings
                          </p>
                        </div>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>}
          </Tabs>
        </div>
      </AnimatedTransition>
    </div>;
};
export default Settings;