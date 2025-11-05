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

  // Generate bookmarklet code - auto-saves to Screenshots space
  const currentDomain = window.location.origin;
  const bookmarkletCode = `javascript:(function(){try{var u='${user?.id || 'USER_ID'}',t=document.title,l=window.location.href,s=window.getSelection().toString(),d='${currentDomain}';console.log('Ayra clipper started');if(!window.html2canvas){var c=document.createElement('script');c.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';c.onerror=function(){alert('Failed to load screenshot library.');};c.onload=function(){console.log('html2canvas loaded');capture();};document.head.appendChild(c);}else{capture();}function capture(){var loader=document.createElement('div');loader.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);color:white;padding:24px 32px;border-radius:12px;z-index:999999;font-family:system-ui;font-size:16px;box-shadow:0 20px 60px rgba(0,0,0,0.5);';loader.textContent='📸 Capturing...';document.body.appendChild(loader);html2canvas(document.body,{allowTaint:true,useCORS:false,foreignObjectRendering:false,removeContainer:true,logging:false,imageTimeout:15000,ignoreElements:function(el){return el.tagName==='IFRAME'||el.tagName==='VIDEO'||el.tagName==='EMBED'||el.tagName==='OBJECT';}}).then(function(canvas){var flash=document.createElement('div');flash.style.cssText='position:fixed;inset:0;background:white;z-index:9999998;opacity:0.8;pointer-events:none;';document.body.appendChild(flash);setTimeout(function(){document.body.removeChild(flash);},300);loader.textContent='💾 Saving...';var img=canvas.toDataURL('image/png');fetch(d+'/functions/v1/save-clip',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:u,title:t,url:l,content:s,screenshot:img})}).then(function(res){return res.json();}).then(function(data){document.body.removeChild(loader);if(data.success){var success=document.createElement('div');success.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(34,197,94,0.95);color:white;padding:24px 32px;border-radius:12px;z-index:999999;font-family:system-ui;font-size:16px;box-shadow:0 20px 60px rgba(0,0,0,0.5);';success.innerHTML='<div style="display:flex;align-items:center;gap:12px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Saved to Screenshots!</span></div>';document.body.appendChild(success);setTimeout(function(){document.body.removeChild(success);},2500);}else{alert('Failed to save: '+data.error);}}).catch(function(err){document.body.removeChild(loader);console.error('Save error:',err);alert('Failed to save clip');});}).catch(function(e){console.error('Screenshot error:',e);document.body.removeChild(loader);fetch(d+'/functions/v1/save-clip',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:u,title:t,url:l,content:s})}).then(function(res){return res.json();}).then(function(data){if(data.success){alert('Saved without screenshot!');}else{alert('Failed to save');}}).catch(function(err){alert('Failed to save clip');});});}}catch(e){console.error('Clipper error:',e);alert('Clipper error: '+e.message);}})();`;

  const copyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Bookmarklet code copied to clipboard'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const testBookmarklet = () => {
    // Execute the bookmarklet code directly
    try {
      // Extract the function from the javascript: URL
      const code = bookmarkletCode.replace('javascript:', '');
      eval(code);
    } catch (error) {
      console.error('Bookmarklet test error:', error);
      toast({
        title: 'Test failed',
        description: 'Please try again or check the console for errors',
        variant: 'destructive'
      });
    }
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
            <div className="text-center space-y-6 mb-16">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse-slow" />
                  <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-2xl">
                    <Bookmark className="h-12 w-12 text-primary" />
                  </div>
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent">
                Clip & Capture
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Save anything from the web with visual screenshots in one click
              </p>
            </div>

            {/* Bookmarklet Setup */}
            <Card className="border-border/50 shadow-lg overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">One-Click Web Clipper</CardTitle>
                    <CardDescription className="mt-1">
                      Drag the button below to your bookmarks bar to install
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {/* Draggable Bookmarklet Button */}
                <div className="flex flex-col items-center gap-6">
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Drag this to your bookmarks bar ↓
                    </p>
                  </div>
                  <a
                    href={bookmarkletCode}
                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 cursor-move select-none hover:scale-105"
                    onClick={(e) => {
                      e.preventDefault();
                      toast({
                        title: '📌 Drag to bookmarks',
                        description: 'Drag this button to your bookmarks bar to install',
                      });
                    }}
                  >
                    <Bookmark className="h-6 w-6" />
                    <span className="text-lg">Clip to Ayra</span>
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <div className="text-center space-y-1">
                    <p className="text-xs text-muted-foreground max-w-md">
                      Or right-click the button and select "Bookmark this link"
                    </p>
                  </div>

                  {/* Test Button */}
                  <div className="pt-4 border-t border-border/50">
                    <p className="text-sm text-muted-foreground mb-3 text-center">
                      Want to test it first?
                    </p>
                    <Button 
                      onClick={testBookmarklet}
                      variant="outline"
                      className="w-full max-w-xs"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Test Clipper Now
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center max-w-md mx-auto">
                      This will capture a screenshot of this page and open the clip window
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* How to Use */}
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">How It Works</CardTitle>
                <CardDescription className="text-base">Three simple steps to start clipping</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  <div className="flex gap-4 items-start group">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold shrink-0 group-hover:scale-110 transition-transform">
                      1
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="font-semibold text-lg">Install the Bookmarklet</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        Drag the "Clip to Ayra" button above to your bookmarks bar
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start group">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold shrink-0 group-hover:scale-110 transition-transform">
                      2
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="font-semibold text-lg">Browse & Select</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        Visit any webpage and optionally highlight text you want to save
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start group">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold shrink-0 group-hover:scale-110 transition-transform">
                      3
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="font-semibold text-lg">Clip & Save</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        Click the bookmarklet—a screenshot is captured and auto-saved to your Screenshots space
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="border-border/50 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-br from-primary/5 to-transparent p-6 border-b border-border/50">
                <CardTitle className="text-2xl">What You Get</CardTitle>
              </div>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex gap-4 items-start p-5 bg-gradient-to-br from-background to-muted/30 rounded-xl border border-border/50 hover:border-primary/50 transition-all group">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Visual Snapshots</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Automatic screenshot capture of every page you clip
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start p-5 bg-gradient-to-br from-background to-muted/30 rounded-xl border border-border/50 hover:border-primary/50 transition-all group">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Smart Highlights</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Save selected text alongside the full page context
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start p-5 bg-gradient-to-br from-background to-muted/30 rounded-xl border border-border/50 hover:border-primary/50 transition-all group">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Instant Capture</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        One click to save—no interruption to your workflow
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start p-5 bg-gradient-to-br from-background to-muted/30 rounded-xl border border-border/50 hover:border-primary/50 transition-all group">
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
                      <Share2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Auto Organization</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Clips organized in your spaces automatically
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Browser Compatibility - Removed, showing minimal badge instead */}
            <div className="text-center">
              <Badge variant="secondary" className="gap-2 py-2 px-4">
                <Globe className="h-4 w-4" />
                Works on all modern browsers
              </Badge>
            </div>

            {/* Troubleshooting Section */}
            <Card className="border-border/50 shadow-lg bg-muted/30">
              <CardHeader>
                <CardTitle className="text-xl">Troubleshooting</CardTitle>
                <CardDescription>If the clipper isn't working</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3 items-start">
                    <div className="text-primary shrink-0 mt-1">•</div>
                    <div>
                      <span className="font-medium">Try a different website:</span> The clipper won't work on useayra.com itself. Test it on Wikipedia, Medium, or any news site.
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="text-primary shrink-0 mt-1">•</div>
                    <div>
                      <span className="font-medium">Check browser console:</span> Right-click → Inspect → Console tab. You should see "Ayra clipper started" when you click the bookmarklet.
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="text-primary shrink-0 mt-1">•</div>
                    <div>
                      <span className="font-medium">Re-add the bookmark:</span> Delete the old one and drag the button again. Make sure the entire bookmark code is saved.
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="text-primary shrink-0 mt-1">•</div>
                    <div>
                      <span className="font-medium">Pop-up blocker:</span> Make sure your browser allows pop-ups for the site you're clipping from.
                    </div>
                  </div>
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
