import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Mail, Calendar, FileText } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

export const NotificationPreferences: React.FC = () => {
  const { settings, updateSetting } = useSettings();

  return (
    <Card className="border-border/50 backdrop-blur-sm bg-card/50 shadow-lg hover:shadow-xl transition-all duration-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose which notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="group flex items-center justify-between p-4 rounded-xl transition-all duration-500 hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md border border-transparent hover:border-border/50">
          <div className="flex items-center gap-3 transition-transform duration-300 group-hover:translate-x-1">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label htmlFor="notifications-master" className="text-base font-medium cursor-pointer">
                All Notifications
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Master switch for all notifications
              </p>
            </div>
          </div>
          <Switch
            id="notifications-master"
            checked={settings.notifications}
            onCheckedChange={(checked) => updateSetting('notifications', checked)}
            className="transition-all duration-300 hover:scale-110"
          />
        </div>

        {settings.notifications && (
          <>
            <div className="group flex items-center justify-between p-4 rounded-xl transition-all duration-500 hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md border border-transparent hover:border-border/50 animate-fade-in">
              <div className="flex items-center gap-3 transition-transform duration-300 group-hover:translate-x-1">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="email-notifications" className="text-base font-medium cursor-pointer">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Receive updates via email
                  </p>
                </div>
              </div>
              <Switch
                id="email-notifications"
                defaultChecked
                className="transition-all duration-300 hover:scale-110"
              />
            </div>

            <div className="group flex items-center justify-between p-4 rounded-xl transition-all duration-500 hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md border border-transparent hover:border-border/50 animate-fade-in">
              <div className="flex items-center gap-3 transition-transform duration-300 group-hover:translate-x-1">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="deadline-notifications" className="text-base font-medium cursor-pointer">
                    Assignment Deadlines
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Remind me about upcoming deadlines
                  </p>
                </div>
              </div>
              <Switch
                id="deadline-notifications"
                defaultChecked
                className="transition-all duration-300 hover:scale-110"
              />
            </div>

            <div className="group flex items-center justify-between p-4 rounded-xl transition-all duration-500 hover:bg-accent/50 hover:scale-[1.02] hover:shadow-md border border-transparent hover:border-border/50 animate-fade-in">
              <div className="flex items-center gap-3 transition-transform duration-300 group-hover:translate-x-1">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="content-notifications" className="text-base font-medium cursor-pointer">
                    Content Updates
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Notify when items are synced or updated
                  </p>
                </div>
              </div>
              <Switch
                id="content-notifications"
                defaultChecked
                className="transition-all duration-300 hover:scale-110"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
