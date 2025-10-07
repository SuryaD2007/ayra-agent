
import React from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { ProjectWithStage } from './types';
import { Edit, Star, Users, Trash2 } from 'lucide-react';
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
      
      <CardContent className="p-4 pt-0 pb-2">
        <p className="text-sm text-muted-foreground">
          {project.description}
        </p>
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
