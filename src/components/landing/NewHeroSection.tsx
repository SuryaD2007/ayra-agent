import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import DiagramComponent from './DiagramComponent';
import { BetaModal } from '@/components/beta/BetaModal';
import { useNavigate } from 'react-router-dom';
import { Download, Search, Sparkles, Brain, Zap } from 'lucide-react';

interface NewHeroSectionProps {
  showTitle: boolean;
}

export const NewHeroSection = ({ showTitle }: NewHeroSectionProps) => {
  const navigate = useNavigate();
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [selectedOS, setSelectedOS] = useState<'mac' | 'windows'>('mac');
  const [activeSection, setActiveSection] = useState<'scattered' | 'convergence' | 'organized'>('scattered');
  
  const heroTexts = {
    scattered: "Transform scattered information into organized knowledge with AI-powered intelligence.",
    convergence: "Watch as Ayra intelligently connects your ideas, creating meaningful relationships between your thoughts.",
    organized: "Experience the power of a truly organized mind - where every piece of information has its perfect place."
  };

  const [heroText, setHeroText] = useState(heroTexts[activeSection]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSection(prev => {
        const sections: Array<'scattered' | 'convergence' | 'organized'> = ['scattered', 'convergence', 'organized'];
        const currentIndex = sections.indexOf(prev);
        const nextIndex = (currentIndex + 1) % sections.length;
        return sections[nextIndex];
      });
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setHeroText(heroTexts[activeSection]);
  }, [activeSection]);

  const handleBetaClick = (os: 'mac' | 'windows') => {
    setSelectedOS(os);
    setShowBetaModal(true);
  };

  const handleSectionClick = (section: 'scattered' | 'convergence' | 'organized') => {
    setActiveSection(section);
  };

  return (
    <AnimatedTransition 
      show={showTitle} 
      animation="fade-in" 
      duration={1000}
      className="w-full flex flex-col items-center justify-center text-center relative"
    >
      <div className="max-w-8xl mx-auto space-y-16 relative z-10">
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-3 h-3 rounded-full bg-primary-glow animate-particle-float opacity-60"></div>
          <div className="absolute top-32 right-1/3 w-2 h-2 rounded-full bg-accent animate-particle-float opacity-80" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-64 left-1/3 w-4 h-4 rounded-full bg-secondary-glow animate-particle-float opacity-50" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-80 right-1/4 w-2 h-2 rounded-full bg-primary animate-particle-float opacity-70" style={{animationDelay: '3s'}}></div>
        </div>

        {/* Main title with animated icons */}
        <div className="space-y-8">
          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="w-16 h-16 rounded-2xl glass-morph flex items-center justify-center hover-expand">
              <Brain className="w-8 h-8 text-primary animate-glow-pulse" />
            </div>
            <h1 className="text-8xl md:text-9xl font-black text-gradient leading-none tracking-tighter">
              Ayra
            </h1>
            <div className="w-16 h-16 rounded-2xl glass-morph flex items-center justify-center hover-expand">
              <Sparkles className="w-8 h-8 text-accent animate-wave" />
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <Zap className="w-8 h-8 text-secondary-glow animate-glow-pulse" />
            <p className="text-3xl md:text-4xl font-bold text-muted-foreground">
              Your Personal AI Engine
            </p>
            <Zap className="w-8 h-8 text-secondary-glow animate-glow-pulse" />
          </div>
        </div>
        
        {/* Dynamic description */}
        <div className="relative max-w-6xl mx-auto">
          <div className="glass-morph rounded-[2rem] p-12 hover-lift">
            <p className="text-2xl md:text-3xl text-foreground leading-relaxed font-medium">
              {heroText}
            </p>
          </div>
        </div>

        {/* Interactive diagram */}
        <div className="flex justify-center py-8">
          <div className="hover-expand">
            <DiagramComponent 
              activeSection={activeSection}
              onSectionClick={handleSectionClick}
            />
          </div>
        </div>

        {/* Action buttons with unique designs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="lg:col-span-1 flex justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/search')}
              className="group relative overflow-hidden rounded-3xl px-12 py-10 text-2xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent shadow-glow hover:shadow-accent transition-all duration-700 hover-shimmer min-w-[280px]"
            >
              <Search className="mr-4 h-8 w-8 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
              <span className="relative z-10">AI Search</span>
            </Button>
          </div>
          
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => handleBetaClick('mac')}
              className="group rounded-3xl px-10 py-10 text-xl font-bold hover-tilt glass-morph border-2 border-primary/50 text-primary hover:bg-primary/10 transition-all duration-500 gradient-border"
            >
              <Download className="mr-4 h-7 w-7 group-hover:translate-y-[-4px] transition-transform duration-300" />
              Download for Mac
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => handleBetaClick('windows')}
              className="group rounded-3xl px-10 py-10 text-xl font-bold hover-tilt glass-morph border-2 border-secondary/50 text-secondary hover:bg-secondary/10 transition-all duration-500 gradient-border"
            >
              <Download className="mr-4 h-7 w-7 group-hover:translate-y-[-4px] transition-transform duration-300" />
              Download for Windows
            </Button>
          </div>
        </div>
      </div>
      
      {showBetaModal && (
        <BetaModal 
          isOpen={showBetaModal} 
          onClose={() => setShowBetaModal(false)}
          os={selectedOS}
        />
      )}
    </AnimatedTransition>
  );
};