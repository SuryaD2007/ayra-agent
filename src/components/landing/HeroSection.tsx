import { ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DiagramComponent from './DiagramComponent';
import { BetaModal } from '@/components/beta/BetaModal';

interface HeroSectionProps {
  showTitle: boolean;
}

export const HeroSection = ({
  showTitle
}: HeroSectionProps) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'scattered' | 'convergence' | 'organized'>('scattered');
  const [heroText, setHeroText] = useState("All your notes, bookmarks, inspirations, articles and images in one single, private second brain, accessible anywhere, anytime.");
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [selectedOs, setSelectedOs] = useState<'mac' | 'windows'>('mac');

  // Auto-detect OS for better UX
  useEffect(() => {
    const isMac = navigator.userAgent.includes("Mac OS X");
    setSelectedOs(isMac ? 'mac' : 'windows');
  }, []);

  const handleBetaClick = (os: 'mac' | 'windows') => {
    setSelectedOs(os);
    setShowBetaModal(true);
  };
  
  const handleSectionClick = (section: 'scattered' | 'convergence' | 'organized', text: string) => {
    setActiveSection(section);
    setHeroText(text);
  };

  return <div className="py-20 md:py-28 flex flex-col items-center text-center">
      <AnimatedTransition show={showTitle} animation="slide-up" duration={600}>
        {/* Launch date announcement */}
        <div className="mb-4 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20">
          🚀 Launching October 17
        </div>
        
        {/* Title first */}
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-clip-text text-blue-600 md:text-7xl">
          Ayra - Your Personal AI Engine
        </h1>
        
        {/* Interactive text second */}
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in" key={heroText}>
          {heroText}
        </p>
        
        {/* Diagram third */}
        <div className="mb-8">
          <DiagramComponent onSectionClick={handleSectionClick} activeSection={activeSection} />
        </div>
        
        {/* Call to action last */}
        <div className="flex flex-col items-center gap-4 mb-6">
          {/* AI Search button at top */}
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate('/search')} 
            className="rounded-full px-8 py-6 text-base font-medium transition-all duration-300"
          >
            <Search className="mr-2 h-4 w-4" />
            AI Search
          </Button>
          
          {/* Mac and Windows buttons underneath */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => handleBetaClick('mac')}
              className="flex items-center gap-3 rounded-2xl px-6 py-4 text-white font-semibold shadow-lg transition transform hover:-translate-y-0.5 bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 border-0"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M18.71 19.5c-.82 1.27-1.7 2.53-3.06 2.56c-1.34.03-1.77-.83-3.3-.83s-1.99.8-3.24.86c-1.3.06-2.3-1.37-3.13-2.62c-1.71-2.58-3.02-7.3-1.26-10.51c.87-1.56 2.43-2.55 4.13-2.58c1.29-.03 2.51.88 3.3.88s2.27-1.09 3.82-.93c.65.03 2.47.26 3.64 2.04c-.09.06-2.17 1.27-2.15 3.78c.03 3.01 2.63 4.02 2.66 4.03c-.03.09-.42 1.48-1.41 3.26zM13.61 3.5c.66-.79 1.12-1.9.99-3.02c-1 .04-2.19.69-2.9 1.48c-.64.71-1.17 1.83-1.02 2.93c1.10.09 2.23-.56 2.93-1.39z"/>
              </svg>
              Download for Mac
            </Button>
            
            <Button 
              size="lg" 
              onClick={() => handleBetaClick('windows')}
              className="flex items-center gap-3 rounded-2xl px-6 py-4 bg-gray-900 text-white font-semibold shadow-lg transition transform hover:-translate-y-0.5 hover:bg-gray-800 border-0"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M2 3.5l9-1.5v9H2zm0 8h9v9l-9-1.5zm20-9v10H12V2zm0 11H12v9l10-1.5z"/>
              </svg>
              Download for Windows
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          No spam. We'll email your invite when your platform opens.
        </p>
      </AnimatedTransition>

      <BetaModal 
        isOpen={showBetaModal} 
        onClose={() => setShowBetaModal(false)}
        os={selectedOs}
      />
    </div>;
};