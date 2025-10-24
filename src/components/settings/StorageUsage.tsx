import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { HardDrive, File, Image, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StorageStats {
  totalBytes: number;
  itemCounts: {
    images: number;
    pdfs: number;
    notes: number;
    other: number;
  };
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const StorageUsage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StorageStats>({
    totalBytes: 0,
    itemCounts: { images: 0, pdfs: 0, notes: 0, other: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStorageStats = async () => {
      if (!user) return;

      try {
        const { data: items, error } = await supabase
          .from('items')
          .select('type, size_bytes')
          .eq('user_id', user.id)
          .is('deleted_at', null);

        if (error) throw error;

        const totalBytes = items?.reduce((sum, item) => sum + (item.size_bytes || 0), 0) || 0;
        const itemCounts = {
          images: items?.filter(i => i.type === 'image').length || 0,
          pdfs: items?.filter(i => i.type === 'pdf').length || 0,
          notes: items?.filter(i => i.type === 'note').length || 0,
          other: items?.filter(i => !['image', 'pdf', 'note'].includes(i.type)).length || 0,
        };

        setStats({ totalBytes, itemCounts });
      } catch (error) {
        console.error('Error fetching storage stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStorageStats();
  }, [user]);

  const storageLimit = 1024 * 1024 * 1024; // 1GB
  const usagePercent = (stats.totalBytes / storageLimit) * 100;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 backdrop-blur-sm bg-card/50 shadow-lg hover:shadow-xl transition-all duration-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Storage Usage
        </CardTitle>
        <CardDescription>
          Track your storage consumption across all items
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Used</span>
            <span className="font-medium">
              {formatBytes(stats.totalBytes)} / {formatBytes(storageLimit)}
            </span>
          </div>
          <Progress value={Math.min(usagePercent, 100)} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {usagePercent.toFixed(1)}% of your storage limit
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Image className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">{stats.itemCounts.images}</p>
              <p className="text-xs text-muted-foreground">Images</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <File className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium">{stats.itemCounts.pdfs}</p>
              <p className="text-xs text-muted-foreground">PDFs</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <FileText className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">{stats.itemCounts.notes}</p>
              <p className="text-xs text-muted-foreground">Notes</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <File className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium">{stats.itemCounts.other}</p>
              <p className="text-xs text-muted-foreground">Other</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
