
import { useState, useEffect } from 'react';
import { useAnimateIn } from '@/lib/animations';
import { HeroSection } from '@/components/landing/HeroSection';
import { UniversityStudentsSection } from '@/components/landing/UniversityStudentsSection';
import { ManageSection } from '@/components/landing/ManageSection';
import { DesignSection } from '@/components/landing/DesignSection';
import { DeploySection } from '@/components/landing/DeploySection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { CallToAction } from '@/components/landing/CallToAction';
import { Footer } from '@/components/landing/Footer';
import { LoadingScreen } from '@/components/landing/LoadingScreen';
import UseCasesSection from '@/components/landing/UseCasesSection';
import { UpcomingEventsWidget } from '@/components/calendar/UpcomingEventsWidget';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleConnection } from '@/hooks/useGoogleConnection';

const Index = () => {
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const { isConnected, calendarEnabled } = useGoogleConnection();
  const showHero = useAnimateIn(false, 300);
  const showUniversities = useAnimateIn(false, 500);
  const showManage = useAnimateIn(false, 700);
  const showDesign = useAnimateIn(false, 1000);
  const showDeploy = useAnimateIn(false, 1300);
  const showUseCases = useAnimateIn(false, 1600);
  const showTestimonials = useAnimateIn(false, 1900);
  const showCallToAction = useAnimateIn(false, 2200);
  const showFooter = useAnimateIn(false, 2500);
  const showWidget = useAnimateIn(false, 800);
  
  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return (
    <div className="relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/5 to-transparent -z-10"></div>
      <div className="absolute top-1/3 right-0 w-[300px] h-[300px] rounded-full bg-primary/5 blur-3xl -z-10"></div>
      <div className="absolute bottom-1/3 left-0 w-[250px] h-[250px] rounded-full bg-accent/5 blur-3xl -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <div className="flex flex-col">
          {/* Hero Section */}
          <HeroSection showTitle={showHero} />
          
          {/* Calendar Widget - Only show if authenticated and calendar connected */}
          {isAuthenticated && isConnected && calendarEnabled && showWidget && (
            <div className="mb-16 animate-fade-in">
              <UpcomingEventsWidget />
            </div>
          )}
          
          {/* University Students Section */}
          <UniversityStudentsSection show={showUniversities} />
          
          {/* Manage Section */}
          <ManageSection show={showManage} />
          
          {/* Design Section */}
          <DesignSection show={showDesign} />
          
          {/* Deploy Section */}
          <DeploySection show={showDeploy} />
          
          {/* Use Cases Section */}
          <UseCasesSection show={showUseCases} />
          
          {/* Testimonials Section */}
          <TestimonialsSection showTestimonials={showTestimonials} />
          
          {/* Call to Action */}
          <CallToAction show={showCallToAction} />
          
          {/* Footer */}
          <Footer show={showFooter} />
        </div>
      </div>
    </div>
  );
};

export default Index;
