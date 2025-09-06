import React, { useState } from 'react';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Grid, List, Calendar, Tag, FileText, Link, Image, File } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import AuthGuard from '@/components/auth/AuthGuard';
import InlineError from '@/components/auth/InlineError';
import AuthModal from '@/components/AuthModal';
import { AuthError } from '@/lib/data';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const SearchPage = () => {
  const showContent = useAnimateIn(false, 300);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Mock data for demonstration
  const searchResults = [
    {
      id: '1',
      title: 'Machine Learning Fundamentals',
      type: 'PDF',
      preview: 'Introduction to machine learning concepts including supervised and unsupervised learning...',
      tags: ['AI', 'Machine Learning', 'Data Science'],
      date: '2024-01-15',
      space: 'Work'
    },
    {
      id: '2',
      title: 'React Best Practices',
      type: 'Link',
      preview: 'A comprehensive guide to React development best practices and patterns...',
      tags: ['React', 'JavaScript', 'Frontend'],
      date: '2024-01-20',
      space: 'Personal'
    },
    {
      id: '3',
      title: 'Design System Notes',
      type: 'Note',
      preview: 'Notes on building a comprehensive design system with reusable components...',
      tags: ['Design', 'UI/UX', 'System'],
      date: '2024-01-25',
      space: 'Work'
    }
  ];

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setChatInput('');
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `I found ${searchResults.length} items related to "${content}". Here are the most relevant results...`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const filteredResults = searchResults.filter(result => {
    if (searchQuery && !result.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !result.preview.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (selectedType !== 'all' && result.type.toLowerCase() !== selectedType.toLowerCase()) {
      return false;
    }
    
    if (selectedTags.length > 0 && !selectedTags.some(tag => result.tags.includes(tag))) {
      return false;
    }
    
    return true;
  });

  return (
    <AuthGuard 
      title="Search your knowledge"
      description="Sign in to search through your notes, documents, and saved content."
    >
      <div className="max-w-full mx-auto min-h-screen pt-24 pb-6">
        {authError && (
          <div className="mb-4 mx-4">
            <InlineError 
              message={authError}
              onSignIn={() => setAuthModalOpen(true)}
            />
          </div>
        )}
        
        <AnimatedTransition show={showContent} animation="slide-up">
          <div className="flex h-[calc(100vh-130px)]">
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-border/50">
                <h1 className="text-2xl font-bold mb-4">Search & Discovery</h1>
                
                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                  <Input
                    placeholder="Search your knowledge base..."
                    className="pl-10 pr-4 py-3 text-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="note">Notes</SelectItem>
                      <SelectItem value="pdf">PDFs</SelectItem>
                      <SelectItem value="link">Links</SelectItem>
                      <SelectItem value="image">Images</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setDatePickerOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Results */}
              <div className="flex-1 overflow-auto p-6">
                <div className="mb-4">
                  <p className="text-muted-foreground">
                    Found {filteredResults.length} results
                    {searchQuery && ` for "${searchQuery}"`}
                  </p>
                </div>
                
                <div className={cn(
                  "gap-4",
                  viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col"
                )}>
                  {filteredResults.map((result) => (
                    <Card key={result.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {result.type === 'PDF' && <File className="h-5 w-5 text-red-500" />}
                            {result.type === 'Link' && <Link className="h-5 w-5 text-blue-500" />}
                            {result.type === 'Note' && <FileText className="h-5 w-5 text-green-500" />}
                            {result.type === 'Image' && <Image className="h-5 w-5 text-purple-500" />}
                            <Badge variant="secondary">{result.type}</Badge>
                          </div>
                          <Badge variant="outline">{result.space}</Badge>
                        </div>
                        <CardTitle className="text-lg">{result.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="mb-3">
                          {result.preview}
                        </CardDescription>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {result.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">{result.date}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {filteredResults.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No results found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search terms or filters
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Chat Panel */}
            <div className="w-80 border-l border-border/50 flex flex-col">
              <div className="p-4 border-b border-border/50">
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-sm text-muted-foreground">Ask questions about your content</p>
              </div>
              
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>Ask me anything about your content!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "p-3 rounded-lg max-w-[90%]",
                        message.sender === 'user'
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
              
              {/* Chat Input */}
              <div className="p-4 border-t border-border/50">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(chatInput);
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!chatInput.trim()}>
                    Send
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </AnimatedTransition>

        <AuthModal 
          isOpen={authModalOpen} 
          onClose={() => setAuthModalOpen(false)} 
        />
      </div>
    </AuthGuard>
  );
};

export default SearchPage;