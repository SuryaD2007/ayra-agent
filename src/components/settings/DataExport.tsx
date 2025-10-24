import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const DataExport: React.FC = () => {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);

  const exportData = async () => {
    if (!user) {
      toast.error('Please log in to export data');
      return;
    }

    setExporting(true);
    try {
      // Fetch all user data
      const [itemsRes, spacesRes, profileRes, linksRes] = await Promise.all([
        supabase.from('items').select('*').eq('user_id', user.id).is('deleted_at', null),
        supabase.from('spaces').select('*').eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('profile_links').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        export_date: new Date().toISOString(),
        user_id: user.id,
        profile: profileRes.data,
        profile_links: linksRes.data,
        spaces: spacesRes.data,
        items: itemsRes.data,
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ayra-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="border-border/50 backdrop-blur-sm bg-card/50 shadow-lg hover:shadow-xl transition-all duration-500">
      <CardHeader>
        <CardTitle>Export Your Data</CardTitle>
        <CardDescription>
          Download all your data in JSON format
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will export all your profile information, spaces, items, and links. 
            The data will be downloaded as a JSON file that you can back up or import elsewhere.
          </p>
          <Button 
            onClick={exportData} 
            disabled={exporting}
            className="w-full sm:w-auto"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
