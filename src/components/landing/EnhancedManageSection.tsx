import { AnimatedTransition } from '@/components/AnimatedTransition';
import { FileText, Bookmark, Image, Video, Link, Database, Filter, Search } from 'lucide-react';

interface EnhancedManageSectionProps {
  show: boolean;
}

export const EnhancedManageSection = ({ show }: EnhancedManageSectionProps) => {
  const features = [
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Smart Documents",
      description: "AI-powered document analysis and categorization",
      color: "from-primary to-primary-glow",
      delay: "0s"
    },
    {
      icon: <Bookmark className="w-8 h-8" />,
      title: "Intelligent Bookmarks",
      description: "Contextual bookmark organization with auto-tagging",
      color: "from-secondary to-secondary-glow",
      delay: "0.2s"
    },
    {
      icon: <Image className="w-8 h-8" />,
      title: "Visual Memory",
      description: "Advanced image recognition and content extraction",
      color: "from-accent to-primary",
      delay: "0.4s"
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: "Media Intelligence",
      description: "Automatic transcription and content indexing",
      color: "from-primary-glow to-secondary",
      delay: "0.6s"
    },
    {
      icon: <Link className="w-8 h-8" />,
      title: "Connection Engine",
      description: "Discover hidden relationships between your content",
      color: "from-secondary-glow to-accent",
      delay: "0.8s"
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: "Knowledge Graph",
      description: "Build your personal knowledge network automatically",
      color: "from-accent to-primary-glow",
      delay: "1s"
    }
  ];

  return (
    <AnimatedTransition show={show} animation="slide-in-left" duration={800}>
      <div className="w-full py-24">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-20">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl glass-morph flex items-center justify-center">
                <Filter className="w-6 h-6 text-primary animate-wave" />
              </div>
              <h2 className="text-6xl md:text-8xl font-black text-gradient">
                Organize
              </h2>
              <div className="w-12 h-12 rounded-xl glass-morph flex items-center justify-center">
                <Search className="w-6 h-6 text-accent animate-glow-pulse" />
              </div>
            </div>
            <p className="text-2xl md:text-3xl text-muted-foreground max-w-4xl mx-auto font-light">
              Transform chaos into clarity with AI-powered organization that learns from your patterns
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative overflow-hidden"
                style={{ animationDelay: feature.delay }}
              >
                <div className="glass-morph rounded-3xl p-8 h-full hover-lift transition-all duration-500 border-2 border-transparent hover:border-primary/30">
                  {/* Gradient background */}
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.color} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  
                  {/* Icon */}
                  <div className="relative z-10 mb-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-glow group-hover:shadow-accent transition-all duration-500 group-hover:scale-110`}>
                      {feature.icon}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom accent */}
          <div className="flex justify-center mt-16">
            <div className="w-24 h-2 rounded-full bg-gradient-to-r from-primary via-accent to-secondary animate-glow-pulse"></div>
          </div>
        </div>
      </div>
    </AnimatedTransition>
  );
};