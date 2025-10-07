import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProjectWithStage } from '@/components/projects/types';
import { toast } from 'sonner';

export const useProjects = () => {
  const [projects, setProjects] = useState<ProjectWithStage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setProjects([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProjects: ProjectWithStage[] = (data || []).map(project => ({
        id: project.id,
        title: project.title,
        description: project.description || '',
        status: project.status as 'active' | 'completed',
        stage: project.stage as 'planning' | 'inProgress' | 'review' | 'completed',
        reviewCount: project.review_count || 0,
        reviewScore: Number(project.review_score) || 0,
      }));

      setProjects(formattedProjects);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (project: Omit<ProjectWithStage, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to create projects');
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: project.title,
          description: project.description,
          status: project.status,
          stage: project.stage,
          review_count: project.reviewCount || 0,
          review_score: project.reviewScore || 0,
        })
        .select()
        .single();

      if (error) throw error;

      const newProject: ProjectWithStage = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        status: data.status as 'active' | 'completed',
        stage: data.stage as 'planning' | 'inProgress' | 'review' | 'completed',
        reviewCount: data.review_count || 0,
        reviewScore: Number(data.review_score) || 0,
      };

      setProjects([newProject, ...projects]);
      toast.success('Project created successfully');
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    }
  };

  const updateProject = async (id: string, updates: Partial<ProjectWithStage>) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: updates.title,
          description: updates.description,
          status: updates.status,
          stage: updates.stage,
          review_count: updates.reviewCount,
          review_score: updates.reviewScore,
        })
        .eq('id', id);

      if (error) throw error;

      setProjects(projects.map(p => 
        p.id === id ? { ...p, ...updates } : p
      ));
      toast.success('Project updated successfully');
    } catch (error: any) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== id));
      toast.success('Project deleted successfully');
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  useEffect(() => {
    fetchProjects();

    // Set up real-time subscription
    const channel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        () => {
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
};
