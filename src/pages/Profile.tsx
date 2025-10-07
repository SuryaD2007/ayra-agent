
import React, { useState } from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import ProjectRoadmap from '@/components/ProjectRoadmap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserProfile } from '@/lib/types';
import { Mail, Save, X, Plus, ExternalLink, AlertCircle, User, Edit2 } from 'lucide-react';
import { validateLinkUrl } from '@/lib/utils';
import { toast } from 'sonner';

const initialProfile: UserProfile = {
  name: 'Alex Johnson',
  email: 'alex@example.com',
  description: 'AI researcher and knowledge management enthusiast. Building a digital second brain to enhance creativity and productivity.',
  links: [
    { title: 'Website', url: 'https://example.com' },
    { title: 'LinkedIn', url: 'https://linkedin.com/in/alexjohnson' },
    { title: 'GitHub', url: 'https://github.com' },
    { title: 'Twitter', url: 'https://twitter.com' },
  ],
};

const Profile = () => {
  const showHeader = useAnimateIn(false, 200);
  const showProfileCard = useAnimateIn(false, 400);
  const showRoadmap = useAnimateIn(false, 600);
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(initialProfile);
  const [tempLink, setTempLink] = useState({ title: '', url: '' });
  const [linkErrors, setLinkErrors] = useState<{[key: number]: string}>({});
  const [newLinkError, setNewLinkError] = useState<string | null>(null);
  
  const handleEditProfile = () => {
    setTempProfile({...profile});
    setIsEditing(true);
  };
  
  const handleSaveProfile = () => {
    // Validate all links before saving
    const errors: {[key: number]: string} = {};
    tempProfile.links?.forEach((link, index) => {
      const error = validateLinkUrl(link.title, link.url);
      if (error) {
        errors[index] = error;
      }
    });
    
    if (Object.keys(errors).length > 0) {
      setLinkErrors(errors);
      toast.error('Please fix invalid URLs before saving');
      return;
    }
    
    setProfile({...tempProfile});
    setLinkErrors({});
    setIsEditing(false);
    toast.success('Profile saved successfully');
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
  };
  
  const handleAddLink = () => {
    if (!tempLink.title || !tempLink.url) {
      setNewLinkError('Both title and URL are required');
      return;
    }
    
    const error = validateLinkUrl(tempLink.title, tempLink.url);
    if (error) {
      setNewLinkError(error);
      return;
    }
    
    setTempProfile({
      ...tempProfile,
      links: [...(tempProfile.links || []), tempLink]
    });
    setTempLink({ title: '', url: '' });
    setNewLinkError(null);
  };
  
  const handleRemoveLink = (index: number) => {
    const newLinks = [...(tempProfile.links || [])];
    newLinks.splice(index, 1);
    setTempProfile({
      ...tempProfile,
      links: newLinks
    });
  };
  
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/5 to-transparent -z-10"></div>
      <div className="absolute top-1/3 right-0 w-[300px] h-[300px] rounded-full bg-primary/5 blur-3xl -z-10"></div>
      <div className="absolute bottom-1/3 left-0 w-[250px] h-[250px] rounded-full bg-accent/5 blur-3xl -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Page Header */}
        <AnimatedTransition show={showHeader} animation="slide-up" duration={500}>
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Profile
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Manage your personal information and track your journey
            </p>
          </div>
        </AnimatedTransition>

        {/* Profile Card */}
        <AnimatedTransition show={showProfileCard} animation="slide-up" duration={600}>
          <div className="mb-12">
            {!isEditing ? (
              <Card className="w-full glass-panel hover-float">
                <CardHeader className="space-y-6 p-8">
                  {/* Profile Header with Avatar */}
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-4 ring-primary/10 hover-glow transition-all">
                      <User className="w-12 h-12 text-primary" />
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                      <CardTitle className="text-3xl mb-2">{profile.name}</CardTitle>
                      <CardDescription className="flex items-center justify-center md:justify-start gap-2 text-base mb-4">
                        <Mail className="h-4 w-4" />
                        {profile.email}
                      </CardDescription>
                      {profile.description && (
                        <p className="text-muted-foreground mt-3 leading-relaxed">
                          {profile.description}
                        </p>
                      )}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={handleEditProfile}
                      className="smooth-bounce group"
                    >
                      <Edit2 className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                      Edit Profile
                    </Button>
                  </div>
                  
                  {/* Links Section */}
                  {profile.links && profile.links.length > 0 && (
                    <div className="pt-6 border-t border-border/50">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-4">Connect</h3>
                      <div className="flex flex-wrap gap-3">
                        {profile.links.map((link, index) => (
                          <a 
                            key={index} 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all smooth-bounce"
                          >
                            {link.title}
                            <ExternalLink size={14} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardHeader>
              </Card>
            ) : (
            <Card className="w-full glass-panel">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-2xl">Edit Profile</CardTitle>
                <CardDescription>Update your personal information and links</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                    <Input 
                      id="name" 
                      value={tempProfile.name}
                      onChange={(e) => setTempProfile({...tempProfile, name: e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={tempProfile.email}
                      onChange={(e) => setTempProfile({...tempProfile, email: e.target.value})}
                      className="h-11"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Input 
                    id="description" 
                    value={tempProfile.description || ''}
                    onChange={(e) => setTempProfile({...tempProfile, description: e.target.value})}
                    placeholder="Tell us about yourself..."
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium">External Links</Label>
                  <div className="rounded-lg border border-border/50 bg-muted/20">
                    <div className="space-y-3 p-4">
                      {tempProfile.links?.map((link, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input 
                              value={link.title}
                              onChange={(e) => {
                                const newLinks = [...(tempProfile.links || [])];
                                newLinks[index] = { ...link, title: e.target.value };
                                setTempProfile({ ...tempProfile, links: newLinks });
                                
                                // Clear error when editing
                                if (linkErrors[index]) {
                                  const newErrors = {...linkErrors};
                                  delete newErrors[index];
                                  setLinkErrors(newErrors);
                                }
                              }}
                              placeholder="Title"
                              className="w-40 h-10"
                            />
                            <Input 
                              value={link.url}
                              onChange={(e) => {
                                const newLinks = [...(tempProfile.links || [])];
                                newLinks[index] = { ...link, url: e.target.value };
                                setTempProfile({ ...tempProfile, links: newLinks });
                                
                                // Validate on change
                                const error = validateLinkUrl(link.title, e.target.value);
                                if (error) {
                                  setLinkErrors({...linkErrors, [index]: error});
                                } else {
                                  const newErrors = {...linkErrors};
                                  delete newErrors[index];
                                  setLinkErrors(newErrors);
                                }
                              }}
                              placeholder="https://example.com"
                              className="flex-1 h-10"
                            />
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleRemoveLink(index)}
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          {linkErrors[index] && (
                            <div className="flex items-center gap-1 text-sm text-destructive ml-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>{linkErrors[index]}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Add New Link</Label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="linkTitle" className="text-sm">Title</Label>
                      <Input 
                        id="linkTitle" 
                        value={tempLink.title}
                        onChange={(e) => {
                          setTempLink({...tempLink, title: e.target.value});
                          setNewLinkError(null);
                        }}
                        placeholder="LinkedIn"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="linkUrl" className="text-sm">URL</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="linkUrl" 
                          value={tempLink.url}
                          onChange={(e) => {
                            setTempLink({...tempLink, url: e.target.value});
                            setNewLinkError(null);
                          }}
                          placeholder="https://linkedin.com/in/username"
                          className="h-10"
                        />
                        <Button onClick={handleAddLink} className="smooth-bounce h-10">
                          <Plus className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                  {newLinkError && (
                    <div className="flex items-center gap-1 text-sm text-destructive ml-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{newLinkError}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-3 px-8 py-6 border-t border-border/50 bg-muted/20">
                <Button variant="outline" size="lg" onClick={handleCancelEdit} className="smooth-bounce">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} size="lg" className="smooth-bounce">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          )}
          </div>
        </AnimatedTransition>
        
        {/* Roadmap Section */}
        <AnimatedTransition show={showRoadmap} animation="slide-up" duration={700}>
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Project Roadmap
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Track your project journey from start to completion and collect reviews
            </p>
          </div>
          
          <ProjectRoadmap />
        </AnimatedTransition>
      </div>
    </div>
  );
};

export default Profile;
