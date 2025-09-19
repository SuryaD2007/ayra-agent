import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, ExternalLink, Calendar, User, Tag } from 'lucide-react';
import { AyraItem } from '@/components/manage/ayra-data';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import { itemToAyraItem } from '@/lib/itemUtils';
import { EnhancedPdfViewer } from '@/components/manage/EnhancedPdfViewer';
import { useNavigate } from 'react-router-dom';

const PreviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [item, setItem] = useState<AyraItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadItem = async () => {
      if (!id || !isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Try to get from cache first
        const cachedItems = DataCache.getAyraItems();
        let foundItem = cachedItems.find(item => item.id === id);
        
        if (!foundItem) {
          // Fetch from API
          const { data: itemData, error: itemError } = await getItem(id);
          
          if (itemError) {
            throw itemError;
          }
          
          if (!itemData) {
            throw new Error('Item not found');
          }
          
          // Convert to AyraItem format
          foundItem = itemToAyraItem(itemData);
        }
        
        setItem(foundItem);
      } catch (error: any) {
        console.error('Error loading item:', error);
        setError(error.message || 'Failed to load item');
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [id, isAuthenticated]);

  const handleDownload = async () => {
    if (!item?.file_path) return;
    
    try {
      // If it's a file, get signed URL and download
      if (item.file_path.startsWith('http')) {
        window.open(item.file_path, '_blank');
      } else {
        // Get signed URL for file download
        const { data: signedUrl, error } = await supabase.storage
          .from('files')
          .createSignedUrl(item.file_path, 3600); // 1 hour expiry
          
        if (error) {
          throw error;
        }
        
        if (signedUrl?.signedUrl) {
          window.open(signedUrl.signedUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleOpenExternal = () => {
    if (item?.url) {
      window.open(item.url, '_blank');
    }
  };

  const getTypeColor = (type: AyraItem['type']) => {
    switch (type) {
      case 'Note':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'PDF':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Link':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Image':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const renderPreview = (item: AyraItem) => {
    switch (item.type) {
      case 'PDF':
        if (item.file_path) {
          return (
            <div className="w-full h-[600px] border rounded-lg overflow-hidden">
              <EnhancedPdfViewer
                file_path={item.file_path}
                title={item.title}
              />
            </div>
          );
        }
        break;
        
      case 'Image':
        if (item.file_path || item.dataUrl) {
          return (
            <div className="flex justify-center">
              <img
                src={item.dataUrl || item.file_path}
                alt={item.title}
                className="max-w-full max-h-[600px] object-contain rounded-lg border"
              />
            </div>
          );
        }
        break;
        
      case 'Note':
        return (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap bg-muted/30 p-4 rounded-lg border">
              {item.content || 'No content available.'}
            </div>
          </div>
        );
        
      case 'Link':
        return (
          <div className="space-y-4">
            {item.description && (
              <div className="text-muted-foreground">
                {item.description}
              </div>
            )}
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
              {item.favicon && (
                <img src={item.favicon} alt="" className="w-4 h-4" />
              )}
              <div className="flex-1">
                <div className="font-medium">{item.title}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {item.url}
                </div>
              </div>
              <Button size="sm" onClick={handleOpenExternal}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit
              </Button>
            </div>
          </div>
        );
    }
    
    // Fallback content
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="text-4xl mb-4">📄</div>
        <p>No preview available for this item type.</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold mb-2">Item Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {error || 'The requested item could not be found.'}
          </p>
          <Button onClick={() => navigate('/manage')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Item Details */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold">{item.title}</h1>
              <div className="flex items-center gap-2">
                {item.file_path && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                )}
                {item.type === 'Link' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenExternal}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open
                  </Button>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-1">
                <Badge className={getTypeColor(item.type)}>
                  {item.type}
                </Badge>
              </div>
              
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(item.createdDate).toLocaleDateString()}
              </div>
              
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {item.source}
              </div>
              
              {item.space && (
                <div className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  {item.space}
                </div>
              )}
            </div>

            {/* Tags */}
            {item.keywords && item.keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {item.keywords.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Preview Content */}
          <div className="bg-card border rounded-lg p-6">
            {renderPreview(item)}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default PreviewPage;