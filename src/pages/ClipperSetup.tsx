import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, Chrome, Copy, Check, Zap, Globe, Share2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useAnimateIn } from '@/lib/animations';

const ClipperSetup = () => {
  const showContent = useAnimateIn(false, 200);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Generate bookmarklet code
  const bookmarkletCode = `javascript:(function(){
    const userId='${user?.id || 'USER_ID'}';
    const title=document.title;
    const url=window.location.href;
    const selection=window.getSelection().toString();
    const clipperUrl='${window.location.origin}/clip?title='+encodeURIComponent(title)+'&url='+encodeURIComponent(url)+'&content='+encodeURIComponent(selection)+'&userId='+userId;
    window.open(clipperUrl,'ayra-clipper','width=500,height=600');
  })();`;

  const copyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Bookmarklet code copied to clipboard'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AuthGuard
      title="Setup Web Clipper"
      description="Sign in to setup your web clipping tools"
    >
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95 pt-20">
        <AnimatedTransition show={showContent} animation="fade">
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse-slow" />
                  <Bookmark className="h-16 w-16 text-primary relative" />
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent">
                Clip Anything to Ayra
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Save web pages, articles, and highlights directly to your Ayra library with one click
              </p>
            </div>

            {/* Bookmarklet Setup */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <CardTitle>Web Clipper Bookmarklet</CardTitle>
                </div>
                <CardDescription>
                  Drag this button to your bookmarks bar or click to copy the code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Draggable Bookmarklet Button */}
                <div className="flex flex-col items-center gap-4 p-6 bg-muted/50 rounded-lg border-2 border-dashed border-primary/50">
                  <p className="text-sm text-muted-foreground text-center">
                    Drag this button to your bookmarks bar
                  </p>
                  <a
                    href={bookmarkletCode}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all cursor-move select-none shadow-lg hover:shadow-xl"
                    onClick={(e) => {
                      e.preventDefault();
                      toast({
                        title: 'Drag to bookmarks',
                        description: 'Drag this button to your bookmarks bar to install',
                        variant: 'default'
                      });
                    }}
                  >
                    <Bookmark className="h-5 w-5" />
                    Clip to Ayra
                  </a>
                  <p className="text-xs text-muted-foreground">
                    Or right-click and select "Bookmark this link"
                  </p>
                </div>

                {/* Copy Code Option */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Or copy the bookmarklet code:</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyBookmarklet}
                      className="gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-3 bg-muted rounded-md font-mono text-xs overflow-x-auto">
                    {bookmarkletCode}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How to Use */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle>How to Use</CardTitle>
                <CardDescription>Follow these simple steps to start clipping</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex gap-4 items-start">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                      1
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold">Install the Bookmarklet</h4>
                      <p className="text-sm text-muted-foreground">
                        Drag the "Clip to Ayra" button to your bookmarks bar or save it as a bookmark
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                      2
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold">Navigate to Any Webpage</h4>
                      <p className="text-sm text-muted-foreground">
                        Visit any article, blog post, or webpage you want to save
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                      3
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold">Highlight Text (Optional)</h4>
                      <p className="text-sm text-muted-foreground">
                        Select any text you want to save as a note. If nothing is selected, the full page will be clipped.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                      4
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold">Click the Bookmarklet</h4>
                      <p className="text-sm text-muted-foreground">
                        Click the "Clip to Ayra" bookmark in your bookmarks bar. A popup will appear to save your clip.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle>Clipper Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex gap-3 items-start p-4 bg-muted/50 rounded-lg">
                    <Globe className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">Full Page Capture</h4>
                      <p className="text-sm text-muted-foreground">
                        Save entire web pages with title and URL
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start p-4 bg-muted/50 rounded-lg">
                    <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">Smart Highlights</h4>
                      <p className="text-sm text-muted-foreground">
                        Select text to clip just the parts you need
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start p-4 bg-muted/50 rounded-lg">
                    <Zap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">One-Click Save</h4>
                      <p className="text-sm text-muted-foreground">
                        Quick capture without leaving your browsing flow
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start p-4 bg-muted/50 rounded-lg">
                    <Share2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">Auto Organization</h4>
                      <p className="text-sm text-muted-foreground">
                        Content is automatically organized in your library
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Browser Compatibility */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle>Browser Support</CardTitle>
                <CardDescription>Works on all modern browsers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="secondary" className="gap-2 py-2 px-4">
                    <Chrome className="h-4 w-4" />
                    Chrome
                  </Badge>
                  <Badge variant="secondary" className="gap-2 py-2 px-4">
                    <Globe className="h-4 w-4" />
                    Firefox
                  </Badge>
                  <Badge variant="secondary" className="gap-2 py-2 px-4">
                    <Globe className="h-4 w-4" />
                    Safari
                  </Badge>
                  <Badge variant="secondary" className="gap-2 py-2 px-4">
                    <Globe className="h-4 w-4" />
                    Edge
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </AnimatedTransition>
      </div>
    </AuthGuard>
  );
};

export default ClipperSetup;
