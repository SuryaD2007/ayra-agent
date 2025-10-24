import { ExternalLink, FileText, Image, Link as LinkIcon, File } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchResult } from "@/types/chat";

interface SourcesListProps {
  sources: SearchResult[];
}

export function SourcesList({ sources }: SourcesListProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'link':
        return <LinkIcon className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <div className="text-sm font-medium text-muted-foreground mb-2">
        Sources ({sources.length})
      </div>
      <div className="grid gap-2">
        {sources.map((source, index) => (
          <Card 
            key={source.id}
            className="p-3 hover:bg-accent/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <Badge variant="outline" className="text-xs">
                  {index + 1}
                </Badge>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getTypeIcon(source.type)}
                  <h4 className="text-sm font-medium truncate">
                    {source.title}
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {source.content}
                </p>
                {source.source && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <ExternalLink className="h-3 w-3" />
                    <span className="truncate">{source.source}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
