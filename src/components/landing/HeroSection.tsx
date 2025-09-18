import { ArrowRight, Search, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DiagramComponent from './DiagramComponent';
import { WaitlistModal } from '@/components/waitlist/WaitlistModal';
interface HeroSectionProps {
  showTitle: boolean;
}
export const HeroSection = ({
  showTitle
}: HeroSectionProps) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'scattered' | 'convergence' | 'organized'>('scattered');
  const [heroText, setHeroText] = useState("All your notes, bookmarks, inspirations, articles and images in one single, private second brain, accessible anywhere, anytime.");
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  
  const handleSectionClick = (section: 'scattered' | 'convergence' | 'organized', text: string) => {
    setActiveSection(section);
    setHeroText(text);
  };
  return <div className="py-20 md:py-28 flex flex-col items-center text-center">
      <AnimatedTransition show={showTitle} animation="slide-up" duration={600}>
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
        <div className="flex flex-wrap justify-center gap-4">
          <Button 
            size="lg" 
            onClick={() => setShowWaitlistModal(true)} 
            className="rounded-full px-8 py-6 text-base font-medium bg-primary hover:bg-primary/90 transition-all duration-300"
          >
            <FileText className="mr-2 h-4 w-4" />
            Start Organizing
          </Button>
          
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate('/search')} 
            className="rounded-full px-8 py-6 text-base font-medium transition-all duration-300"
          >
            <Search className="mr-2 h-4 w-4" />
            AI Search
          </Button>
        </div>
      </AnimatedTransition>

      <WaitlistModal 
        isOpen={showWaitlistModal} 
        onClose={() => setShowWaitlistModal(false)} 
      />
    </div>;
};