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
  
  return <AnimatedTransition show={show} animation="scale-bounce" duration={800}>
      <div className="relative py-24 md:py-32 text-center overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 glass-morph rounded-[3rem] mx-8"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-glow/20 rounded-full blur-3xl animate-glow-pulse"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-8">
          <h2 className="text-5xl md:text-7xl font-black mb-6 text-gradient">
            Ready to transform your productivity?
          </h2>
          <p className="text-2xl md:text-3xl mb-12 text-muted-foreground/80 font-light">
            Get started with AI-powered organization today.
          </p>
          
          <div className="flex justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/search')}
              className="group rounded-full px-12 py-8 text-xl font-bold hover-lift bg-gradient-to-r from-accent via-primary to-secondary shadow-accent hover:shadow-glow transition-all duration-500"
            >
              <Search className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
              Try AI Search
            </Button>
          </div>
        </div>
      </div>
    </AnimatedTransition>;
};