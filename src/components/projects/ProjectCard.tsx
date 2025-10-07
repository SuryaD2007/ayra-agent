
import React from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectWithStage } from './types';
import { Edit, Star, Users, Trash2, Link2, FileText, Calendar, AlertCircle, Tag } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ProjectCardProps {
  project: ProjectWithStage;
  onDragStart: (project: ProjectWithStage) => void;
  onEdit: (project: ProjectWithStage) => void;
  onMoveNext: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  stage: ProjectWithStage['stage'];
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onDragStart, 
  onEdit, 
  onMoveNext,
  onDelete,
  stage 
}) => {
  return (
    <Card 
      key={project.id} 
      className="border transition-all hover:shadow-md cursor-pointer"
      draggable
      onDragStart={() => onDragStart(project)}
      onClick={() => onEdit(project)}
    >
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">{project.title}</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 pb-2 space-y-3">
        <p className="text-sm text-muted-foreground">
          {project.description}
        </p>

        {/* Priority & Due Date Preview */}
        <div className="flex flex-wrap items-center gap-2">
          {project.priority && (
            <Badge 
              variant="secondary" 
              className={`text-xs ${
                project.priority === 'high' 
                  ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' 
                  : project.priority === 'medium'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              {project.priority}
            </Badge>
          )}
          
          {project.due_date && (
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(project.due_date).toLocaleDateString()}
            </Badge>
          )}
        </div>

        {/* Tags Preview */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {project.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs hover-glow">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {project.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{project.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Links Preview */}
        {project.project_links && project.project_links.length > 0 && (
          <div className="space-y-1.5">
            {project.project_links.slice(0, 2).map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors group"
              >
                <Link2 className="h-3 w-3 flex-shrink-0" />
                <span className="truncate group-hover:underline">{link.title}</span>
              </a>
            ))}
            {project.project_links.length > 2 && (
              <p className="text-xs text-muted-foreground pl-5">
                +{project.project_links.length - 2} more link{project.project_links.length - 2 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Files Preview */}
        {project.project_files && project.project_files.length > 0 && (
          <div className="space-y-1.5">
            {project.project_files.slice(0, 2).map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <FileText className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{file.name}</span>
                {file.size && (
                  <span className="text-[10px]">({(file.size / 1024).toFixed(1)}KB)</span>
                )}
              </div>
            ))}
            {project.project_files.length > 2 && (
              <p className="text-xs text-muted-foreground pl-5">
                +{project.project_files.length - 2} more file{project.project_files.length - 2 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-2 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {stage === 'review' && (
            <div className="flex items-center gap-1">
              <Users size={14} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{project.reviewCount} reviews</span>
            </div>
          )}
          
          {stage === 'completed' && project.reviewScore! > 0 && (
            <div className="flex items-center gap-1">
              <Star size={14} className="text-amber-500 fill-amber-500" />
              <span className="text-xs text-muted-foreground">{project.reviewScore?.toFixed(1)}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(project);
            }}
            className="text-xs flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 transition-colors"
          >
            <Edit size={12} />
            Edit
          </button>
          
          {stage !== 'completed' && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onMoveNext(project.id);
              }}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {stage === 'planning' ? 'Start' : stage === 'inProgress' ? 'Submit for Review' : 'Complete'}
            </button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="text-xs flex items-center gap-1 px-2 py-1 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Project</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{project.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project.id);
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
