import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Plug, Globe2, Upload, Type, Youtube, Bookmark } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CSVImportDrawer } from '@/components/import/CSVImportDrawer';
import { APIConnectDrawer } from '@/components/import/APIConnectDrawer';  
import { LinkImportDrawer } from '@/components/import/LinkImportDrawer';
import { FileImportDrawer } from '@/components/import/FileImportDrawer';
import { TextImportDrawer } from '@/components/import/TextImportDrawer';
import { VideoImportDrawer } from '@/components/import/VideoImportDrawer';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { cn } from '@/lib/utils';

type ImportType = 'csv' | 'api' | 'url' | 'file' | 'text' | 'video' | 'clipper';

interface ImportCard {
  id: ImportType;
  title: string;
  description: string;
  icon: React.ReactNode;
  isExternal?: boolean;
}

const importCards: ImportCard[] = [
  {
    id: 'file',
    title: 'Document Upload',
    description: 'Upload documents, PDFs, and other files',
    icon: <Upload size={24} />
  },
  {
    id: 'url',
    title: 'Web URL',
    description: 'Import content from websites and articles',
    icon: <Globe2 size={24} />
  },
  {
    id: 'clipper',
    title: 'Web Clipper',
    description: 'Setup bookmarklet to clip from any webpage',
    icon: <Bookmark size={24} />,
    isExternal: true
  },
  {
    id: 'video',
    title: 'YouTube Video',
    description: 'Import YouTube videos with AI transcript',
    icon: <Youtube size={24} />
  },
  {
    id: 'csv',
    title: 'CSV File',
    description: 'Import structured data from CSV files',
    icon: <FileSpreadsheet size={24} />
  },
  {
    id: 'text',
    title: 'Text Input',
    description: 'Directly input or paste text content',
    icon: <Type size={24} />
  },
  {
    id: 'api',
    title: 'API Integration',
    description: 'Connect to external APIs and services',
    icon: <Plug size={24} />
  }
];

const ImportHub = () => {
  const [activeDrawer, setActiveDrawer] = useState<ImportType | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const showContent = useAnimateIn(false, 300);

  // Get preselected space from URL params
  const preselectedSpace = searchParams.get('space') || 'Personal';

  // Hotkey support
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case '1':
          setActiveDrawer('file');
          break;
        case '2':
          setActiveDrawer('url');
          break;
        case '3':
          setActiveDrawer('video');
          break;
        case '4':
          setActiveDrawer('csv');
          break;
        case '5':
          setActiveDrawer('text');
          break;
        case '6':
          setActiveDrawer('api');
          break;
        case 'Escape':
          setActiveDrawer(null);
          break;
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  const handleCardClick = (importType: ImportType) => {
    // Check if it's an external link
    const card = importCards.find(c => c.id === importType);
    if (card?.isExternal && importType === 'clipper') {
      navigate('/clipper');
      return;
    }
    setActiveDrawer(importType);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent, importType: ImportType) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveDrawer(importType);
    }
  };

  const closeDrawer = () => {
    setActiveDrawer(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
      <AnimatedTransition show={showContent} animation="slide-up">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Import Data</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Add knowledge to your second brain from various sources
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {importCards.map((card, index) => (
            <Card
              key={card.id}
              className={cn(
                "group cursor-pointer transition-all duration-300",
                "hover:-translate-y-0.5 hover:shadow-lg hover:ring-2 hover:ring-primary/20",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:-translate-y-0.5"
              )}
              role="button"
              tabIndex={0}
              aria-label={`Import from ${card.title}: ${card.description}`}
              onClick={() => handleCardClick(card.id)}
              onKeyDown={(e) => handleCardKeyDown(e, card.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors flex-shrink-0">
                    {card.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-foreground mb-0.5">
                      {card.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {card.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AnimatedTransition>

      {/* Inline import content */}
      {activeDrawer && (
        <div className="mt-8 max-w-4xl mx-auto">
          <Card>
            {activeDrawer === 'csv' && (
              <CSVImportDrawer 
                onClose={closeDrawer} 
                preselectedSpace={preselectedSpace}
              />
            )}
            {activeDrawer === 'api' && (
              <APIConnectDrawer onClose={closeDrawer} />
            )}
            {activeDrawer === 'url' && (
              <LinkImportDrawer 
                onClose={closeDrawer} 
                preselectedSpace={preselectedSpace}
              />
            )}
            {activeDrawer === 'video' && (
              <VideoImportDrawer 
                onClose={closeDrawer} 
                preselectedSpace={preselectedSpace}
              />
            )}
            {activeDrawer === 'file' && (
              <FileImportDrawer 
                onClose={closeDrawer} 
                preselectedSpace={preselectedSpace}
              />
            )}
            {activeDrawer === 'text' && (
              <TextImportDrawer 
                onClose={closeDrawer} 
                preselectedSpace={preselectedSpace}
              />
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default ImportHub;