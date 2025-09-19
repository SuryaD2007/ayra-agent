import { Button } from '@/components/ui/button';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BetaModal } from '@/components/beta/BetaModal';
interface CallToActionProps {
  show: boolean;
}
export const CallToAction = ({
  show
}: CallToActionProps) => {
  const navigate = useNavigate();
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
  
  return <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <div className="py-16 md:py-24 text-primary-foreground rounded-2xl text-center bg-gradient-to-b from-blue-500 to-blue-700">
        <h2 className="text-4xl font-bold mb-4 md:text-6xl">The brain upgrade is loading.</h2>
        <p className="text-xl mb-10">Pick your platform to join the private beta.</p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Button 
            size="lg" 
            onClick={() => handleBetaClick('mac')}
            className="flex items-center gap-3 rounded-2xl px-6 py-4 text-white font-semibold shadow-lg transition transform hover:-translate-y-0.5 bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 border-0"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M18.71 19.5c-.82 1.27-1.7 2.53-3.06 2.56c-1.34.03-1.77-.83-3.3-.83s-1.99.8-3.24.86c-1.3.06-2.3-1.37-3.13-2.62c-1.71-2.58-3.02-7.3-1.26-10.51c.87-1.56 2.43-2.55 4.13-2.58c1.29-.03 2.51.88 3.3.88s2.27-1.09 3.82-.93c.65.03 2.47.26 3.64 2.04c-.09.06-2.17 1.27-2.15 3.78c.03 3.01 2.63 4.02 2.66 4.03c-.03.09-.42 1.48-1.41 3.26zM13.61 3.5c.66-.79 1.12-1.9.99-3.02c-1 .04-2.19.69-2.9 1.48c-.64.71-1.17 1.83-1.02 2.93c1.1.09 2.23-.56 2.93-1.39z"/>
            </svg>
            Get for Mac (Beta)
          </Button>
          
          <Button 
            size="lg" 
            onClick={() => handleBetaClick('windows')}
            className="flex items-center gap-3 rounded-2xl px-6 py-4 bg-gray-900 text-white font-semibold shadow-lg transition transform hover:-translate-y-0.5 hover:bg-gray-800 border-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M2 3.5l9-1.5v9H2zm0 8h9v9l-9-1.5zm20-9v10H12V2zm0 11H12v9l10-1.5z"/>
            </svg>
            Get for Windows (Beta)
          </Button>
        </div>

        <p className="text-sm text-primary-foreground/80 mb-8">
          No spam. We'll email your invite when your platform opens.
        </p>

        <div className="flex justify-center">
          <Button 
            size="lg" 
            variant="outline" 
            onClick={() => navigate('/search')}
            className="rounded-full px-8 py-6 text-base font-medium bg-transparent text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10 transition-all duration-300"
          >
            <Search className="mr-2 h-4 w-4" />
            Try AI Search
          </Button>
        </div>
      </div>

      <BetaModal 
        isOpen={showBetaModal} 
        onClose={() => setShowBetaModal(false)}
        os={selectedOs}
      />
    </AnimatedTransition>;
};