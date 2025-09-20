import { AnimatedTransition } from '@/components/AnimatedTransition';
import { Palette, Layers, Sparkles, Wand2, Eye, Target } from 'lucide-react';

interface EnhancedDesignSectionProps {
  show: boolean;
}

export const EnhancedDesignSection = ({ show }: EnhancedDesignSectionProps) => {
  const designFeatures = [
    {
      icon: <Palette className="w-10 h-10" />,
      title: "Adaptive Interface",
      description: "UI that evolves with your workflow patterns and preferences",
      gradient: "from-primary to-accent"
    },
    {
      icon: <Layers className="w-10 h-10" />,
      title: "Contextual Layouts",
      description: "Dynamic arrangements based on content type and usage",
      gradient: "from-secondary to-primary-glow"
    },
    {
      icon: <Sparkles className="w-10 h-10" />,
      title: "Smart Aesthetics",
      description: "AI-curated visual themes that enhance focus and productivity",
      gradient: "from-accent to-secondary-glow"
    },
    {
      icon: <Wand2 className="w-10 h-10" />,
      title: "Intuitive Creation",
      description: "Effortless content creation with intelligent suggestions",
      gradient: "from-primary-glow to-accent"
    }
  ];

  return (
    <AnimatedTransition show={show} animation="slide-in-right" duration={900}>
      <div className="w-full py-24">
        <div className="max-w-7xl mx-auto">
          {/* Header with animated elements */}
          <div className="text-center mb-20 relative">
            {/* Floating design elements */}
            <div className="absolute top-0 left-1/4 w-8 h-8 rounded-lg bg-primary/20 animate-float-slow blur-sm"></div>
            <div className="absolute top-16 right-1/3 w-6 h-6 rounded-full bg-accent/30 animate-particle-float"></div>
            <div className="absolute -top-8 right-1/4 w-4 h-4 rounded-full bg-secondary-glow/40 animate-morph"></div>
            
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="w-16 h-16 rounded-2xl glass-morph flex items-center justify-center hover-expand">
                <Eye className="w-8 h-8 text-secondary animate-glow-pulse" />
              </div>
              <h2 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-secondary via-accent to-primary bg-clip-text text-transparent">
                Design
              </h2>
              <div className="w-16 h-16 rounded-2xl glass-morph flex items-center justify-center hover-expand">
                <Target className="w-8 h-8 text-primary animate-wave" />
              </div>
            </div>
            
            <p className="text-2xl md:text-3xl text-muted-foreground max-w-4xl mx-auto font-light leading-relaxed">
              Experience design that thinks with you - beautiful, functional, and personally crafted
            </p>
          </div>

          {/* Main content area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left side - Features */}
            <div className="space-y-8">
              {designFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="group flex items-start gap-6 hover-lift"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  {/* Icon container */}
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-glow group-hover:shadow-accent transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                    {feature.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right side - Visual showcase */}
            <div className="relative">
              {/* Main showcase card */}
              <div className="glass-morph rounded-[3rem] p-12 hover-expand relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)`,
                    backgroundSize: '30px 30px'
                  }}></div>
                </div>
                
                {/* Content */}
                <div className="relative z-10 text-center space-y-8">
                  <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center shadow-glow animate-morph">
                    <Sparkles className="w-12 h-12 text-white animate-glow-pulse" />
                  </div>
                  
                  <h3 className="text-3xl font-bold text-gradient">
                    Personalized Experience
                  </h3>
                  
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Every element adapts to your unique workflow, creating an interface that feels like a natural extension of your mind.
                  </p>
                  
                  {/* Feature highlights */}
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    {['Smart Themes', 'Adaptive Layouts', 'Contextual Tools', 'Personal Insights'].map((item, index) => (
                      <div 
                        key={index}
                        className="p-4 rounded-xl bg-gradient-to-r from-background/50 to-muted/30 border border-border/50 hover-tilt"
                      >
                        <span className="text-sm font-medium text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-8 right-8 w-4 h-4 rounded-full bg-accent/60 animate-particle-float"></div>
                <div className="absolute bottom-8 left-8 w-6 h-6 rounded-full bg-primary/40 animate-float-slow"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedTransition>
  );
};