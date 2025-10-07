
import React, { useState } from 'react';
import { ProjectWithStage, ProjectStage } from './projects/types';
import ProjectStageColumn from './projects/ProjectStageColumn';
import ProjectEditor from './projects/ProjectEditor';
import { useProjects } from '@/hooks/useProjects';
import { Loader2 } from 'lucide-react';

const ProjectRoadmap: React.FC = () => {
  const { projects, loading, createProject, updateProject, deleteProject } = useProjects();
  const [editingProject, setEditingProject] = useState<ProjectWithStage | null>(null);
  const [draggedProject, setDraggedProject] = useState<ProjectWithStage | null>(null);
  
  const addNewProject = async () => {
    await createProject({
      title: 'New Project',
      description: 'Click to edit project details',
      status: 'active',
      stage: 'planning',
      reviewCount: 0,
      reviewScore: 0
    });
  };
  
  const moveToNextStage = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const stageOrder: ProjectStage[] = ['planning', 'inProgress', 'review', 'completed'];
    const currentIndex = stageOrder.indexOf(project.stage!);
    
    if (currentIndex < stageOrder.length - 1) {
      await updateProject(projectId, { stage: stageOrder[currentIndex + 1] });
    }
  };
  
  const handleDragStart = (project: ProjectWithStage) => {
    setDraggedProject(project);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = async (targetStage: ProjectStage) => {
    if (draggedProject && draggedProject.stage !== targetStage) {
      await updateProject(draggedProject.id, { stage: targetStage });
      setDraggedProject(null);
    }
  };
  
  const startEditingProject = (project: ProjectWithStage) => {
    setEditingProject({...project});
  };
  
  const saveProjectChanges = async () => {
    if (editingProject) {
      await updateProject(editingProject.id, editingProject);
      setEditingProject(null);
    }
  };
  
  const cancelEditingProject = () => {
    setEditingProject(null);
  };
  
  const updateEditingProject = (updatedProject: ProjectWithStage) => {
    setEditingProject(updatedProject);
  };
  
  if (editingProject) {
    return (
      <ProjectEditor
        project={editingProject}
        onSave={saveProjectChanges}
        onCancel={cancelEditingProject}
        onChange={updateEditingProject}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="w-full space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['planning', 'inProgress', 'review', 'completed'] as ProjectStage[]).map(stage => (
          <ProjectStageColumn
            key={stage}
            stage={stage}
            projects={projects}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onEdit={startEditingProject}
            onMoveNext={moveToNextStage}
            onDelete={deleteProject}
            onAddNew={stage === 'planning' ? addNewProject : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default ProjectRoadmap;
