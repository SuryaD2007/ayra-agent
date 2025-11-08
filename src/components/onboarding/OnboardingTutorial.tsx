import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingStep {
  title: string;
  description: string;
  target?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const steps: OnboardingStep[] = [
  {
    title: 'Welcome to Ayra!',
    description: 'Let\'s take a quick tour to help you get started with your personal AI engine.',
  },
  {
    title: 'Create Your First Space',
    description: 'Spaces help you organize your content. Click the "New Space" button to create one for work, school, or personal use.',
    target: '[data-onboarding="new-space"]',
    placement: 'right',
  },
  {
    title: 'Add Your First Item',
    description: 'Items can be notes, PDFs, links, or images. Click the "+" button to add your first piece of knowledge.',
    target: '[data-onboarding="add-item"]',
    placement: 'bottom',
  },
  {
    title: 'Switch Between Views',
    description: 'Choose from Table, Grid, Kanban, Timeline, Neural, or List views to visualize your content in different ways.',
    target: '[data-onboarding="view-switcher"]',
    placement: 'left',
  },
  {
    title: 'Use AI Search',
    description: 'Access powerful AI search from the sidebar to find and chat with your knowledge base.',
    target: '[data-onboarding="ai-search"]',
    placement: 'right',
  },
  {
    title: 'Import Content',
    description: 'Quickly import content from files, URLs, YouTube videos, or connect your Google Drive and Canvas.',
    target: '[data-onboarding="import"]',
    placement: 'right',
  },
  {
    title: 'You\'re All Set!',
    description: 'You\'re ready to build your personal knowledge base. Start adding content and let Ayra help you stay organized!',
  },
];

export const OnboardingTutorial: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('settings')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        const settings = (data?.settings as Record<string, any>) || {};
        const hasCompletedOnboarding = settings.onboarding_completed === true;

        if (!hasCompletedOnboarding) {
          // Wait a bit before showing to let the page load
          setTimeout(() => setIsVisible(true), 500);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  useEffect(() => {
    if (!isVisible) return;

    const updateTargetPosition = () => {
      const target = steps[currentStep].target;
      if (target) {
        const element = document.querySelector(target);
        if (element) {
          setTargetRect(element.getBoundingClientRect());
        } else {
          setTargetRect(null);
        }
      } else {
        setTargetRect(null);
      }
    };

    updateTargetPosition();
    window.addEventListener('resize', updateTargetPosition);
    window.addEventListener('scroll', updateTargetPosition);

    return () => {
      window.removeEventListener('resize', updateTargetPosition);
      window.removeEventListener('scroll', updateTargetPosition);
    };
  }, [currentStep, isVisible]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    await markOnboardingComplete();
    setIsVisible(false);
  };

  const handleComplete = async () => {
    await markOnboardingComplete();
    setIsVisible(false);
  };

  const markOnboardingComplete = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('settings')
        .eq('user_id', user.id)
        .single();

      const currentSettings = (profile?.settings as Record<string, any>) || {};

      await supabase
        .from('profiles')
        .update({
          settings: {
            ...currentSettings,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
          } as any,
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    }
  };

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const getTooltipPosition = () => {
    if (!targetRect || !currentStepData.target) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const placement = currentStepData.placement || 'bottom';
    const offset = 20;

    switch (placement) {
      case 'top':
        return {
          top: `${targetRect.top - offset}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translate(-50%, -100%)',
        };
      case 'bottom':
        return {
          top: `${targetRect.bottom + offset}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translate(-50%, 0)',
        };
      case 'left':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.left - offset}px`,
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.right + offset}px`,
          transform: 'translate(0, -50%)',
        };
      default:
        return {
          top: `${targetRect.bottom + offset}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translate(-50%, 0)',
        };
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 animate-in fade-in-0" />

      {/* Spotlight on target element */}
      {targetRect && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: '0 0 0 4px hsl(var(--primary)), 0 0 0 9999px rgba(0,0,0,0.5)',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
          }}
        />
      )}

      {/* Tooltip Card */}
      <Card
        className="fixed z-50 w-96 max-w-[calc(100vw-2rem)] p-6 shadow-lg animate-in fade-in-0 zoom-in-95"
        style={getTooltipPosition()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{currentStepData.title}</h3>
            <div className="flex items-center gap-1 mb-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentStep
                      ? 'w-6 bg-primary'
                      : idx < currentStep
                      ? 'w-1.5 bg-primary/50'
                      : 'w-1.5 bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-2 -mt-2"
            onClick={handleSkip}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-6">{currentStepData.description}</p>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Skip tour
          </Button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {isLastStep ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Get started
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
};
