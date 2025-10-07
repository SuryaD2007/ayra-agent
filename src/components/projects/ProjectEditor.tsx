import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ProjectWithStage, ProjectLink, ProjectFile } from './types';
import { Link2, Upload, X, Plus, Calendar, AlertCircle, FileText, Tag, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProjectEditorProps {
  project: ProjectWithStage;
  onSave: () => void;
  onCancel: () => void;
  onChange: (updatedProject: ProjectWithStage) => void;
}

const ProjectEditor: React.FC<ProjectEditorProps> = ({ 
  project, 
  onSave, 
  onCancel, 
  onChange 
}) => {
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [newTag, setNewTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const addLink = () => {
    if (newLink.title && newLink.url) {
      const updatedLinks = [...(project.project_links || []), newLink];
      onChange({ ...project, project_links: updatedLinks });
      setNewLink({ title: '', url: '' });
    }
  };

  const removeLink = (index: number) => {
    const updatedLinks = (project.project_links || []).filter((_, i) => i !== index);
    onChange({ ...project, project_links: updatedLinks });
  };

  const addTag = () => {
    if (newTag && !project.tags?.includes(newTag)) {
      const updatedTags = [...(project.tags || []), newTag];
      onChange({ ...project, tags: updatedTags });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    const updatedTags = (project.tags || []).filter(t => t !== tag);
    onChange({ ...project, tags: updatedTags });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newFiles: ProjectFile[] = [];

    try {
      for (const file of Array.from(files)) {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `project-files/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('ayra-files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive"
          });
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('ayra-files')
          .getPublicUrl(filePath);

        newFiles.push({
          name: file.name,
          url: publicUrl,
          size: file.size,
          type: file.type
        });
      }

      const updatedFiles = [...(project.project_files || []), ...newFiles];
      onChange({ ...project, project_files: updatedFiles });

      toast({
        title: "Files uploaded",
        description: `${newFiles.length} file(s) uploaded successfully`
      });
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const removeFile = async (index: number) => {
    const fileToRemove = project.project_files?.[index];
    if (fileToRemove?.url) {
      // Extract file path from URL and delete from storage
      const urlParts = fileToRemove.url.split('/');
      const filePath = urlParts.slice(urlParts.indexOf('project-files')).join('/');
      
      if (filePath.includes('project-files/')) {
        await supabase.storage
          .from('ayra-files')
          .remove([filePath]);
      }
    }
    
    const updatedFiles = (project.project_files || []).filter((_, i) => i !== index);
    onChange({ ...project, project_files: updatedFiles });
  };

  const priorityColors = {
    low: 'bg-muted text-muted-foreground',
    medium: 'bg-accent text-accent-foreground',
    high: 'bg-destructive/10 text-destructive'
  };

  return (
    <Card className="w-full max-w-4xl mx-auto animate-slide-up glass-panel">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Edit Project</CardTitle>
        <CardDescription>Update your project details and add additional information</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Basic Info Section */}
        <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-card/50 animate-fade-in">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            Basic Information
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="projectTitle">Project Title</Label>
            <Input 
              id="projectTitle" 
              value={project.title}
              onChange={(e) => onChange({...project, title: e.target.value})}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              placeholder="Enter project name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="projectDescription">Description</Label>
            <Input 
              id="projectDescription" 
              value={project.description}
              onChange={(e) => onChange({...project, description: e.target.value})}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              placeholder="Brief description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectNotes">Additional Notes</Label>
            <Textarea 
              id="projectNotes" 
              value={project.notes || ''}
              onChange={(e) => onChange({...project, notes: e.target.value})}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 min-h-[100px]"
              placeholder="Add detailed notes, requirements, or any other information..."
            />
          </div>
        </div>

        {/* Priority & Due Date Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border border-border/50 bg-card/50 animate-fade-in">
          <div className="space-y-2">
            <Label htmlFor="priority" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Priority
            </Label>
            <Select 
              value={project.priority || 'medium'} 
              onValueChange={(value: 'low' | 'medium' | 'high') => onChange({...project, priority: value})}
            >
              <SelectTrigger className="transition-all duration-200 hover:border-primary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Due Date
            </Label>
            <Input 
              id="dueDate"
              type="date"
              value={project.due_date || ''}
              onChange={(e) => onChange({...project, due_date: e.target.value})}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Links Section */}
        <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-card/50 animate-fade-in">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <Link2 className="h-4 w-4" />
            Project Links
          </h3>
          
          <div className="space-y-2">
            {project.project_links && project.project_links.length > 0 && (
              <div className="space-y-2 mb-4">
                {project.project_links.map((link, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 p-3 rounded-md bg-muted/50 hover-glow group"
                  >
                    <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{link.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLink(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity smooth-bounce"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2">
              <Input 
                placeholder="Link title"
                value={newLink.title}
                onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
              <Input 
                placeholder="URL"
                value={newLink.url}
                onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
              <Button 
                onClick={addLink} 
                size="icon"
                variant="secondary"
                className="smooth-bounce flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Files Section */}
        <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-card/50 animate-fade-in">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <Upload className="h-4 w-4" />
            Project Files
          </h3>
          
          {project.project_files && project.project_files.length > 0 && (
            <div className="space-y-2 mb-4">
              {project.project_files.map((file, index) => {
                const isImage = file.type?.startsWith('image/');
                return (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-3 rounded-md bg-muted/50 hover-glow group"
                  >
                    {isImage ? (
                      <img 
                        src={file.url} 
                        alt={file.name}
                        className="h-12 w-12 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      {file.size && (
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity smooth-bounce"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="flex items-center justify-center w-full">
            <label className={cn(
              "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-all duration-200 hover-glow",
              uploading && "opacity-50 cursor-not-allowed"
            )}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {uploading ? (
                  <>
                    <Loader2 className="w-8 h-8 mb-2 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Uploading files...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">Any file type supported</p>
                  </>
                )}
              </div>
              <input 
                type="file" 
                className="hidden" 
                multiple 
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Tags Section */}
        <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-card/50 animate-fade-in">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
            <Tag className="h-4 w-4" />
            Tags
          </h3>
          
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {project.tags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className="hover-glow group cursor-pointer"
                >
                  {tag}
                  <X 
                    className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex gap-2">
            <Input 
              placeholder="Add a tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
            <Button 
              onClick={addTag} 
              size="icon"
              variant="secondary"
              className="smooth-bounce flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end gap-2 border-t border-border/50 pt-6">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="smooth-bounce"
        >
          Cancel
        </Button>
        <Button 
          onClick={onSave}
          className="smooth-bounce hover-glow"
        >
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProjectEditor;
