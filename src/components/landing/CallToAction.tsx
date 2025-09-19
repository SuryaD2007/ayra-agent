import { Button } from '@/components/ui/button';
import { AnimatedTransition } from '@/components/AnimatedTransition';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

interface CallToActionProps {
  show: boolean;
}

export const CallToAction = ({
  show
}: CallToActionProps) => {
  const navigate = useNavigate();
  
  return <AnimatedTransition show={show} animation="slide-up" duration={600}>
      <div className="py-16 md:py-24 text-primary-foreground rounded-2xl text-center bg-gradient-to-b from-primary to-primary/80">
        <h2 className="text-4xl font-bold mb-4 md:text-6xl">Ready to transform your productivity?</h2>
        <p className="text-xl mb-10">Get started with AI-powered organization today.</p>
        
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
    </AnimatedTransition>;
};