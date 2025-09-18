import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SourceCard as SourceCardType } from '@/types/chat';
import { useNavigate } from 'react-router-dom';

interface SourceCardProps {
  source: SourceCardType;
}

export function SourceCard({ source }: SourceCardProps) {
  const navigate = useNavigate();

  const handleOpenLink = () => {
    // Check if it's an internal preview URL
    if (source.url.startsWith('/preview/')) {
      navigate(source.url);
    } else {
      window.open(source.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="hover:bg-muted/50 transition-colors cursor-pointer group" onClick={handleOpenLink}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {source.favicon && (
            <img 
              src={source.favicon} 
              alt=""
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {source.title}
              </h4>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <ExternalLink size={12} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {source.domain}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}