
import { Project } from '@/lib/types';

export interface ProjectLink {
  title: string;
  url: string;
}

export interface ProjectFile {
  name: string;
  url: string;
  size?: number;
}

export interface ProjectWithStage extends Project {
  stage?: 'planning' | 'inProgress' | 'review' | 'completed';
  reviewCount?: number;
  reviewScore?: number;
  project_links?: ProjectLink[];
  project_files?: ProjectFile[];
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  notes?: string;
}

export type ProjectStage = 'planning' | 'inProgress' | 'review' | 'completed';
