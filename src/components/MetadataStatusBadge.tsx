import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MetadataStatusBadgeProps {
  status: 'success' | 'failed' | 'loading';
  className?: string;
}

const MetadataStatusBadge: React.FC<MetadataStatusBadgeProps> = ({ status, className }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          text: 'Metadata Ready',
          variant: 'default' as const,
          tooltip: 'Link metadata successfully generated'
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'Metadata Failed',
          variant: 'destructive' as const,
          tooltip: 'Failed to generate metadata - OpenAI API key may be missing or invalid'
        };
      case 'loading':
        return {
          icon: <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />,
          text: 'Loading...',
          variant: 'secondary' as const,
          tooltip: 'Generating metadata...'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={config.variant} className={`flex items-center gap-1 ${className}`}>
          {config.icon}
          {config.text}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{config.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default MetadataStatusBadge;