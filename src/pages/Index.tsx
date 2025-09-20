
import { useState, useEffect } from 'react';
import { useAnimateIn } from '@/lib/animations';
import { NewHeroSection } from '@/components/landing/NewHeroSection';
import { EnhancedManageSection } from '@/components/landing/EnhancedManageSection';
import { EnhancedDesignSection } from '@/components/landing/EnhancedDesignSection';
import { DeploySection } from '@/components/landing/DeploySection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { CallToAction } from '@/components/landing/CallToAction';
import { Footer } from '@/components/landing/Footer';
import { LoadingScreen } from '@/components/landing/LoadingScreen';
import UseCasesSection from '@/components/landing/UseCasesSection';

const Index = () => {
  const [loading, setLoading] = useState(true);
  const showHero = useAnimateIn(false, 300);
  const showManage = useAnimateIn(false, 600);
  const showDesign = useAnimateIn(false, 900);
  const showDeploy = useAnimateIn(false, 1200);
  const showUseCases = useAnimateIn(false, 1500);
  const showTestimonials = useAnimateIn(false, 1800);
  const showCallToAction = useAnimateIn(false, 2100);
  const showFooter = useAnimateIn(false, 2400);
  
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
    <div className="relative overflow-hidden mesh-gradient min-h-screen">
      {/* Floating orbs */}
      <div className="floating-orb w-96 h-96 bg-primary-glow top-10 -left-48 animate-float-slow"></div>
      <div className="floating-orb w-80 h-80 bg-secondary-glow top-1/2 -right-40 animate-particle-float"></div>
      <div className="floating-orb w-64 h-64 bg-accent top-2/3 left-1/4 animate-morph"></div>
      <div className="floating-orb w-48 h-48 bg-primary top-1/4 right-1/3 animate-wave"></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      <div className="relative z-10">
        <div className="max-w-8xl mx-auto px-6 sm:px-8 lg:px-12 pt-8 pb-16">
          <div className="space-y-32">
            {/* Hero Section */}
            <section className="min-h-screen flex items-center justify-center">
              <NewHeroSection showTitle={showHero} />
            </section>
            
            {/* Manage Section */}
            <section className="min-h-screen flex items-center">
              <EnhancedManageSection show={showManage} />
            </section>
            
            {/* Design Section */}
            <section className="min-h-screen flex items-center">
              <EnhancedDesignSection show={showDesign} />
            </section>
            
            {/* Deploy Section */}
            <section className="min-h-screen flex items-center">
              <DeploySection show={showDeploy} />
            </section>
            
            {/* Use Cases Section */}
            <section className="py-32">
              <UseCasesSection show={showUseCases} />
            </section>
            
            {/* Testimonials Section */}
            <section className="py-32">
              <TestimonialsSection showTestimonials={showTestimonials} />
            </section>
            
            {/* Call to Action */}
            <section className="py-32">
              <CallToAction show={showCallToAction} />
            </section>
            
            {/* Footer */}
            <Footer show={showFooter} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
