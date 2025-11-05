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

  // Generate bookmarklet code with screenshot capture and flash animation
  const bookmarkletCode = `javascript:(function(){
    const userId='${user?.id || 'USER_ID'}';
    const title=document.title;
    const url=window.location.href;
    const selection=window.getSelection().toString();
    
    // Load html2canvas library
    if(!window.html2canvas){
      const script=document.createElement('script');
      script.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload=function(){captureAndClip();};
      document.head.appendChild(script);
    }else{
      captureAndClip();
    }
    
    function captureAndClip(){
      // Show loading indicator
      const loader=document.createElement('div');
      loader.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);color:white;padding:24px 32px;border-radius:12px;z-index:999999;font-family:system-ui,-apple-system,sans-serif;font-size:16px;font-weight:500;box-shadow:0 10px 40px rgba(0,0,0,0.3);';
      loader.innerHTML='<div style="display:flex;align-items:center;gap:12px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite;"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg><span>Capturing screenshot...</span></div>';
      const style=document.createElement('style');
      style.textContent='@keyframes spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(style);
      document.body.appendChild(loader);
      
      html2canvas(document.body,{
        allowTaint:true,
        useCORS:true,
        scrollY:-window.scrollY,
        scrollX:-window.scrollX,
        windowWidth:document.documentElement.scrollWidth,
        windowHeight:document.documentElement.scrollHeight
      }).then(function(canvas){
        // Camera flash animation
        const flash=document.createElement('div');
        flash.style.cssText='position:fixed;inset:0;background:white;z-index:9999999;animation:flash 0.5s ease-out;pointer-events:none;';
        const flashStyle=document.createElement('style');
        flashStyle.textContent='@keyframes flash{0%{opacity:0}50%{opacity:0.8}100%{opacity:0}}@keyframes slideDown{0%{transform:translateY(-120%);opacity:0}100%{transform:translateY(0);opacity:1}}';
        document.head.appendChild(flashStyle);
        document.body.appendChild(flash);
        
        // Show success message
        loader.innerHTML='<div style="display:flex;align-items:center;gap:12px;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Screenshot captured!</span></div>';
        
        const screenshot=canvas.toDataURL('image/png');
        
        setTimeout(function(){
          document.body.removeChild(flash);
          document.body.removeChild(loader);
          
          // Show preview thumbnail
          const preview=document.createElement('div');
          preview.style.cssText='position:fixed;top:20px;right:20px;width:280px;background:rgba(0,0,0,0.95);padding:12px;border-radius:12px;z-index:999999;box-shadow:0 20px 60px rgba(0,0,0,0.5);animation:slideDown 0.6s cubic-bezier(0.34,1.56,0.64,1);';
          preview.innerHTML='<div style="position:relative;"><img src="'+screenshot+'" style="width:100%;height:auto;border-radius:8px;"/><div style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.7);color:white;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:600;font-family:system-ui,-apple-system,sans-serif;">Preview</div></div>';
          document.body.appendChild(preview);
          
          setTimeout(function(){
            document.body.removeChild(preview);
            document.head.removeChild(style);
            document.head.removeChild(flashStyle);
            const clipperUrl='https://useayra.com/clip?title='+encodeURIComponent(title)+'&url='+encodeURIComponent(url)+'&content='+encodeURIComponent(selection)+'&userId='+userId+'&screenshot='+encodeURIComponent(screenshot);
            window.open(clipperUrl,'ayra-clipper','width=600,height=700');
          },1500);
        },500);
      }).catch(function(err){
        document.body.removeChild(loader);
        document.head.removeChild(style);
        alert('Screenshot failed. Clipping without image.');
        const clipperUrl='https://useayra.com/clip?title='+encodeURIComponent(title)+'&url='+encodeURIComponent(url)+'&content='+encodeURIComponent(selection)+'&userId='+userId;
        window.open(clipperUrl,'ayra-clipper','width=600,height=700');
      });
    }
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
                        Click the bookmarklet—a screenshot is captured automatically and saved to your library
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
          </div>
        </AnimatedTransition>
      </div>
    </AuthGuard>
  );
};

export default ClipperSetup;
