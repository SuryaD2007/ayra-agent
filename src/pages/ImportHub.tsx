import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileSpreadsheet, Plug, Globe2, Upload, Type } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Drawer } from '@/components/ui/drawer';
import { CSVImportDrawer } from '@/components/import/CSVImportDrawer';
import { APIConnectDrawer } from '@/components/import/APIConnectDrawer';  
import { LinkImportDrawer } from '@/components/import/LinkImportDrawer';
import { FileImportDrawer } from '@/components/import/FileImportDrawer';
import { TextImportDrawer } from '@/components/import/TextImportDrawer';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { cn } from '@/lib/utils';

type ImportType = 'csv' | 'api' | 'url' | 'file' | 'text';

interface ImportCard {
  id: ImportType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const importCards: ImportCard[] = [
  {
    id: 'csv',
    title: 'CSV File',
    description: 'Import structured data from CSV files',
    icon: <FileSpreadsheet size={24} />
  },
  {
    id: 'api',
    title: 'API Integration',
    description: 'Connect to external APIs and services',
    icon: <Plug size={24} />
  },
  {
    id: 'url',
    title: 'Web URL',
    description: 'Import content from websites and articles',
    icon: <Globe2 size={24} />
  },
  {
    id: 'file',
    title: 'Document Upload',
    description: 'Upload documents, PDFs, and other files',
    icon: <Upload size={24} />
  },
  {
    id: 'text',
    title: 'Text Input',
    description: 'Directly input or paste text content',
    icon: <Type size={24} />
  }
];

const ImportHub = () => {
  const [activeDrawer, setActiveDrawer] = useState<ImportType | null>(null);
  const [searchParams] = useSearchParams();
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
          setActiveDrawer('csv');
          break;
        case '2':
          setActiveDrawer('api');
          break;
        case '3':
          setActiveDrawer('url');
          break;
        case '4':
          setActiveDrawer('file');
          break;
        case '5':
          setActiveDrawer('text');
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {importCards.map((card, index) => (
            <Card
              key={card.id}
              className={cn(
                "group cursor-pointer transition-all duration-300 min-w-[200px]",
                "hover:-translate-y-0.5 hover:shadow-lg hover:ring-2 hover:ring-primary/20",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:-translate-y-0.5"
              )}
              role="button"
              tabIndex={0}
              aria-label={`Import from ${card.title}: ${card.description}`}
              onClick={() => handleCardClick(card.id)}
              onKeyDown={(e) => handleCardKeyDown(e, card.id)}
            >
              <CardContent className="p-4 text-center">
                <div className="flex flex-col items-center space-y-3">
                  <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {card.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {card.description}
                    </p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Press {index + 1} to open
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AnimatedTransition>

      {/* Drawers for each import type */}
      <Drawer open={activeDrawer === 'csv'} onOpenChange={(open) => !open && closeDrawer()}>
        <CSVImportDrawer 
          onClose={closeDrawer} 
          preselectedSpace={preselectedSpace}
        />
      </Drawer>

      <Drawer open={activeDrawer === 'api'} onOpenChange={(open) => !open && closeDrawer()}>
        <APIConnectDrawer onClose={closeDrawer} />
      </Drawer>

      <Drawer open={activeDrawer === 'url'} onOpenChange={(open) => !open && closeDrawer()}>
        <LinkImportDrawer 
          onClose={closeDrawer} 
          preselectedSpace={preselectedSpace}
        />
      </Drawer>

      <Drawer open={activeDrawer === 'file'} onOpenChange={(open) => !open && closeDrawer()}>
        <FileImportDrawer 
          onClose={closeDrawer} 
          preselectedSpace={preselectedSpace}
        />
      </Drawer>

      <Drawer open={activeDrawer === 'text'} onOpenChange={(open) => !open && closeDrawer()}>
        <TextImportDrawer 
          onClose={closeDrawer} 
          preselectedSpace={preselectedSpace}
        />
      </Drawer>
    </div>
  );
};

export default ImportHub;